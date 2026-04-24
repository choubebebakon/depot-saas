import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { DepotScopeService } from './common/depot-scope.service';

dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private _extendedClient: any;

    constructor(private readonly depotScope: DepotScopeService) {
        const connectionString = process.env.DATABASE_URL;
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);

        super({ adapter });

        const directDepotModels = [
            'User', 'Stock', 'LotStock', 'MouvementStock', 'CommandeFournisseur',
            'Vente', 'Client', 'DetteClient', 'PortefeuilleConsigne', 'MouvementConsigne',
            'Fournisseur', 'ReceptionFournisseur', 'Tricycle', 'Tournee', 'SessionCaisse',
            'Depense', 'JournalAudit', 'MaintenanceTricycle', 'ConsommationCarburant', 'Commission'
        ];

        const relationScopedWhere: Record<string, (depotId: string) => Record<string, unknown>> = {
            LigneVente: (depotId) => ({ vente: { depotId } }),
            LigneReception: (depotId) => ({ reception: { depotId } }),
            MouvementCaisse: (depotId) => ({ session: { depotId } }),
            LigneChargement: (depotId) => ({ tournee: { depotId } }),
            TransfertStock: (depotId) => ({ OR: [{ sourceDepotId: depotId }, { destDepotId: depotId }] }),
            LigneTransfert: (depotId) => ({ transfert: { OR: [{ sourceDepotId: depotId }, { destDepotId: depotId }] } }),
        };

        // Création de l'extension pour remplacer $use
        this._extendedClient = this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const depotId = depotScope.getDepotId();
                        // On cast args en any pour éviter les erreurs de type TS sur 'where', 'data', etc.
                        const anyArgs = args as any;

                        // Si pas de depotId, on laisse passer sans filtre (ex: login)
                        if (!depotId) return query(args);

                        // 1. GESTION DES LECTURES (Filtrage)
                        if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                            if (directDepotModels.includes(model)) {
                                anyArgs.where = { ...anyArgs.where, depotId };
                            } else if (relationScopedWhere[model]) {
                                anyArgs.where = { ...anyArgs.where, ...relationScopedWhere[model](depotId) };
                            }
                        }

                        // 2. GESTION DES CRÉATIONS (Injection automatique)
                        if (['create', 'createMany', 'upsert'].includes(operation)) {
                            if (directDepotModels.includes(model)) {
                                if (operation === 'create') {
                                    anyArgs.data = { ...anyArgs.data, depotId };
                                } else if (operation === 'createMany') {
                                    if (Array.isArray(anyArgs.data)) {
                                        anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, depotId }));
                                    }
                                } else if (operation === 'upsert') {
                                    anyArgs.create = { ...anyArgs.create, depotId };
                                }
                            }
                        }

                        return query(anyArgs);
                    },
                },
            },
        });

        // On remplace les méthodes de base par celles de l'extension
        return this._extendedClient;
    }

    async onModuleInit() {
        try {
            await this.$connect();
            console.log('✅ Base de données connectée et Isolation active !');
        } catch (error) {
            console.error('❌ Erreur de connexion database:', error.message);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}