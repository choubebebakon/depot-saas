import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { DepotScopeService } from './common/depot-scope.service';

dotenv.config();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private _extendedClient: any;

  constructor(private readonly depotScope: DepotScopeService) {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString,
      client_encoding: 'UTF8',
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });

    // Modèles dont l'isolation est directement portée par depotId.
    const directDepotModels = [
      'User',
      'Stock',
      'LotStock',
      'MouvementStock',
      'CommandeFournisseur',
      'Vente',
      'Client',
      'DetteClient',
      'PortefeuilleConsigne',
      'MouvementConsigne',
      'Fournisseur',
      'ReceptionFournisseur',
      'Tricycle',
      'Tournee',
      'SessionCaisse',
      'Depense',
      'JournalAudit',
      'MaintenanceTricycle',
      'ConsommationCarburant',
      'Commission',
    ];

    // Modèles dont l'isolation est portée directement par tenantId et qui
    // peuvent être utilisés sans dépôt actif (catalogue partagé du tenant).
    const directTenantModels = [
      'PaiementSouscription',
      'Famille',
      'Marque',
      'Categorie',
      'Article',
    ];

    const relationScopedWhere: Record<
      string,
      (depotId: string) => Record<string, unknown>
    > = {
      LigneVente: (depotId) => ({ vente: { depotId } }),
      LigneReception: (depotId) => ({ reception: { depotId } }),
      MouvementCaisse: (depotId) => ({ session: { depotId } }),
      LigneChargement: (depotId) => ({ tournee: { depotId } }),
      TransfertStock: (depotId) => ({
        OR: [{ sourceDepotId: depotId }, { destDepotId: depotId }],
      }),
      LigneTransfert: (depotId) => ({
        transfert: {
          OR: [{ sourceDepotId: depotId }, { destDepotId: depotId }],
        },
      }),
    };

    const readOperations = new Set([
      'findMany',
      'findFirst',
      'findUnique',
      'findUniqueOrThrow',
      'findFirstOrThrow',
      'count',
      'aggregate',
      'groupBy',
    ]);

    const mutationWhereOperations = new Set([
      'update',
      'updateMany',
      'delete',
      'deleteMany',
    ]);

    this._extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = depotScope.getTenantId();
            const depotId = depotScope.getDepotId();
            const anyArgs = args as any;

            // Hors requête authentifiée, le contexte est anonyme. On ne doit
            // jamais fabriquer un tenant/depot de substitution.
            if (!tenantId) {
              return query(args);
            }

            // ----------------------------------------------------------------
            // 0. PROTECTION ATOMIQUE DU STOCK
            // ----------------------------------------------------------------
            // Les ventes POS utilisent principalement upsert + decrement.
            // Ajouter la quantité disponible au WHERE transforme l'opération
            // en contrôle optimiste atomique : deux ventes concurrentes ne
            // peuvent pas toutes deux décrémenter un stock insuffisant.
            // Pour un upsert, un stock absent ou insuffisant ne doit surtout
            // pas être créé avec une quantité négative : on rejette donc le
            // chemin create lorsque sa quantité serait négative.
            if (model === 'Stock' && ['update', 'updateMany', 'upsert'].includes(operation)) {
              const decrement = Number(anyArgs.data?.quantite?.decrement ?? 0);

              if (Number.isFinite(decrement) && decrement > 0) {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  quantite: { gte: decrement },
                };

                if (operation === 'upsert') {
                  const createQuantite = Number(anyArgs.create?.quantite ?? 0);
                  if (Number.isFinite(createQuantite) && createQuantite < 0) {
                    throw new BadRequestException(
                      'Stock insuffisant pour effectuer cette sortie.',
                    );
                  }
                }
              }
            }

            // ----------------------------------------------------------------
            // 1. ISOLATION TENANT DIRECTE
            // ----------------------------------------------------------------
            if (directTenantModels.includes(model)) {
              if (
                readOperations.has(operation) ||
                mutationWhereOperations.has(operation)
              ) {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  tenantId,
                };
              }

              if (operation === 'create') {
                anyArgs.data = {
                  ...anyArgs.data,
                  tenantId,
                };
              }

              if (operation === 'createMany' && Array.isArray(anyArgs.data)) {
                anyArgs.data = anyArgs.data.map((item: any) => ({
                  ...item,
                  tenantId,
                }));
              }

              if (operation === 'upsert') {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  tenantId,
                };
                anyArgs.create = {
                  ...anyArgs.create,
                  tenantId,
                };
                anyArgs.update = {
                  ...anyArgs.update,
                  tenantId,
                };
              }

              return query(anyArgs);
            }

            // ----------------------------------------------------------------
            // 2. ISOLATION DEPOT DIRECTE
            // ----------------------------------------------------------------
            if (depotId && directDepotModels.includes(model)) {
              if (
                readOperations.has(operation) ||
                mutationWhereOperations.has(operation)
              ) {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  depotId,
                };
              }

              if (operation === 'create') {
                anyArgs.data = {
                  ...anyArgs.data,
                  depotId,
                };
              }

              if (operation === 'createMany' && Array.isArray(anyArgs.data)) {
                anyArgs.data = anyArgs.data.map((item: any) => ({
                  ...item,
                  depotId,
                }));
              }

              if (operation === 'upsert') {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  depotId,
                };
                anyArgs.create = {
                  ...anyArgs.create,
                  depotId,
                };
              }

              return query(anyArgs);
            }

            // ----------------------------------------------------------------
            // 3. ISOLATION DEPOT PAR RELATION
            // ----------------------------------------------------------------
            if (depotId && relationScopedWhere[model]) {
              const scopedWhere = relationScopedWhere[model](depotId);

              if (
                readOperations.has(operation) ||
                mutationWhereOperations.has(operation)
              ) {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  ...scopedWhere,
                };
              }

              if (operation === 'upsert') {
                anyArgs.where = {
                  ...(anyArgs.where ?? {}),
                  ...scopedWhere,
                };
              }

              return query(anyArgs);
            }

            // Les modèles globaux (Tenant, abonnements, configuration globale,
            // etc.) ne sont pas artificiellement filtrés par depotId.
            return query(anyArgs);
          },
        },
      },
    });

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop === 'onModuleInit' || prop === 'onModuleDestroy') {
          return target[prop].bind(target);
        }
        return Reflect.get(target._extendedClient, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Base de données connectée et Isolation active !');
    } catch (error) {
      console.error('❌ Erreur de connexion database:', (error as any).message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
