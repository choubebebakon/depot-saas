import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { decodeHistoryCursor, encodeHistoryCursor } from './crm-cursor';
import { flattenMetaData, toJsonObject } from './crm-deep-merge';
import { CrmLogger } from './crm-logger.service';
import { formatAmount, clientUniqueWhere, toCustomerProfile, toSaleSummary } from './crm-mapper';
import { CrmSettingsService } from './crm-settings.service';
import type {
  CrmConsigneSnapshot,
  CrmCustomerLookup,
  CrmIdentifier,
  CrmLoyaltySnapshot,
  CrmPurchaseHistoryPage,
} from './crm.types';

/** Borne technique du nombre de types de consigne renvoyés. */
const MAX_CONSIGNE_TYPES = 50;

/** Nombre maximum de ventes chargées en une fois pour l'historique. */
const HISTORY_FETCH_OVERHEAD = 1;

export interface FindCustomerInput {
  readonly tenantId: string;
  readonly identifier: CrmIdentifier;
  readonly limit?: number;
  readonly cursor?: string;
  readonly requestId: string;
}

/**
 * Projection minimale : jamais d'objet Client complet, jamais d'`include`.
 * Chaque colonne listée ici est consommée par la réponse, et aucune relation
 * n'est chargée (l'historique, la fidélité et les consignes sont des requêtes
 * ciblées et bornées).
 */
const CLIENT_SELECT = {
  id: true,
  nom: true,
  telephone: true,
  instagramId: true,
  messengerId: true,
  depotId: true,
  createdAt: true,
  updatedAt: true,
  metaData: true,
} as const;

/**
 * Lecture CRM : retrouve une fiche client par identifiant de canal et renvoie
 * le contexte utile à l'agent IA (profil, métadonnées, historique borné,
 * fidélité, consignes, paramètres du shop).
 */
@Injectable()
export class CrmCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: CrmSettingsService,
    private readonly logger: CrmLogger,
  ) {}

  async findCustomer(input: FindCustomerInput): Promise<CrmCustomerLookup> {
    const startedAt = Date.now();

    // Les paramètres du shop et la fiche client sont deux accès indexés : on
    // les lance en parallèle pour ne payer qu'un seul aller-retour de latence.
    const [tenant, profile] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: { parametres: true },
      }),
      this.prisma.client.findUnique({
        where: clientUniqueWhere(input.tenantId, input.identifier),
        select: CLIENT_SELECT,
      }),
    ]);

    const shopSettings = this.settings.resolve(tenant?.parametres ?? null);
    const identifierRef = this.logger.subjectRef(input.identifier.value);

    if (!profile) {
      this.logger.info('crm_customer_not_found', {
        requestId: input.requestId,
        tenantId: input.tenantId,
        channel: input.identifier.channel,
        identifierRef,
        durationMs: Date.now() - startedAt,
      });

      return {
        found: false,
        reason: 'UNKNOWN_IDENTIFIER',
        channel: input.identifier.channel,
        identifierRef,
        nextAction:
          "Contact inconnu : demander le nom du client, puis enregistrer la fiche via /crm/customer/upsert (aucun nom de remplacement n'est créé automatiquement).",
        shopSettings,
      };
    }

    const limit = this.resolveLimit(
      input.limit,
      shopSettings.history.defaultLimit,
      shopSettings.history.maxLimit,
    );
    const metaData = toJsonObject(profile.metaData);

    const [history, loyalty, consignes] = await Promise.all([
      this.loadHistory(input.tenantId, profile.id, limit, input.cursor),
      this.loadLoyalty(profile.id),
      this.loadConsignes(profile.id),
    ]);

    this.logger.info('crm_customer_found', {
      requestId: input.requestId,
      tenantId: input.tenantId,
      customerId: profile.id,
      channel: input.identifier.channel,
      identifierRef,
      historyCount: history.items.length,
      durationMs: Date.now() - startedAt,
    });

    return {
      found: true,
      customer: toCustomerProfile(profile),
      metaData,
      metaDataFlat: flattenMetaData(metaData),
      history,
      loyalty,
      consignes,
      shopSettings,
    };
  }

  private resolveLimit(
    requested: number | undefined,
    shopDefault: number,
    shopMax: number,
  ): number {
    if (requested === undefined) return shopDefault;
    return Math.min(Math.max(Math.trunc(requested), 1), shopMax);
  }

  /**
   * Historique d'achats TOUJOURS borné (jamais de tableau non limité) :
   * pagination keyset sur (date DESC, id DESC) servie par
   * l'index Vente (clientId, date DESC, id DESC).
   *
   * On lit `limit + 1` lignes : la ligne supplémentaire prouve l'existence
   * d'une page suivante sans requête COUNT séparée.
   */
  private async loadHistory(
    tenantId: string,
    clientId: string,
    limit: number,
    cursorRaw?: string,
  ): Promise<CrmPurchaseHistoryPage> {
    const cursor = cursorRaw ? decodeHistoryCursor(cursorRaw) : null;

    const rows = await this.prisma.vente.findMany({
      where: {
        tenantId,
        clientId,
        ...(cursor
          ? {
              OR: [
                { date: { lt: new Date(cursor.date) } },
                { date: new Date(cursor.date), id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: limit + HISTORY_FETCH_OVERHEAD,
      select: {
        id: true,
        reference: true,
        date: true,
        statut: true,
        modePaiement: true,
        total: true,
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map(toSaleSummary);
    const last = items[items.length - 1];

    return {
      items,
      limit,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeHistoryCursor({ date: last.date, id: last.id })
          : null,
    };
  }

  /**
   * Fidélité telle qu'enregistrée : le module se contente de restituer les
   * points et le niveau. Il n'applique AUCUN ratio de conversion (ce ratio est
   * un paramètre du shop, exposé séparément dans shopSettings.loyalty).
   */
  private async loadLoyalty(
    clientId: string,
  ): Promise<CrmLoyaltySnapshot | null> {
    const loyalty = await this.prisma.programmeFidelite.findUnique({
      where: { clientId },
      select: { points: true, niveau: true, totalDepense: true },
    });

    if (!loyalty) return null;

    return {
      points: loyalty.points,
      niveau: loyalty.niveau,
      totalDepense: formatAmount(loyalty.totalDepense),
    };
  }

  /**
   * Solde de contenants en circulation : c'est une créance réelle du dépôt sur
   * son client. Le montant est recalculé avec le référentiel du shop
   * (TypeConsigneConfig.valeurXAF), jamais avec une constante.
   *
   * Le client est identifié par un id issu d'une lecture déjà filtrée par
   * tenantId : aucune donnée d'un autre commerçant ne peut être atteinte ici.
   */
  private async loadConsignes(
    clientId: string,
  ): Promise<readonly CrmConsigneSnapshot[]> {
    const rows = await this.prisma.portefeuilleConsigne.findMany({
      // Une quantité nulle ne représente aucune créance en cours : on ne
      // renvoie que les soldes réellement ouverts (aritmétique, pas un seuil
      // métier arbitraire).
      where: { clientId, quantite: { not: 0 } },
      orderBy: { typeConsigneId: 'asc' },
      take: MAX_CONSIGNE_TYPES,
      select: {
        quantite: true,
        typeConsigne: { select: { type: true, valeurXAF: true } },
      },
    });

    return rows.map((row) => this.toConsigneSnapshot(row));
  }

  private toConsigneSnapshot(row: {
    readonly quantite: number;
    readonly typeConsigne: { readonly type: string; readonly valeurXAF: number };
  }): CrmConsigneSnapshot {
    const montant = new Prisma.Decimal(row.quantite).mul(
      row.typeConsigne.valeurXAF,
    );

    return {
      typeConsigne: row.typeConsigne.type,
      quantiteEnCirculation: row.quantite,
      valeurUnitaire: formatAmount(row.typeConsigne.valeurXAF),
      montantEnCirculation: montant.toFixed(2),
    };
  }
}