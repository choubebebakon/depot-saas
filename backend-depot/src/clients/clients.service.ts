import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';
import {
  mapUniqueViolation,
  normalizeChannelId,
} from '../common/customer-channel.util';
import { decodeHistoryCursor } from '../crm/crm-cursor';
import { CrmSettingsService } from '../crm/crm-settings.service';

/** Requête brute de la page d'historique, reprise du service CRM (clé => projection). */
interface ClientSaleRow {
  id: string;
  reference: string;
  date: Date;
  statut: string;
  modePaiement: string;
  total: number;
}

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private readonly depotScope: DepotScopeService,
    private readonly crmSettings: CrmSettingsService,
  ) {}

  private normalizeDepotId(depotId?: string | null): string | undefined {
    if (
      !depotId ||
      depotId === 'undefined' ||
      depotId === 'null' ||
      depotId === 'all'
    ) {
      return undefined;
    }
    return depotId;
  }

  private assertScope(tenantId: string, depotId: string): void {
    const scopedTenantId = this.depotScope.getTenantId();
    const scopedDepotId = this.depotScope.getDepotId();

    if (!scopedTenantId || scopedTenantId !== tenantId) {
      throw new ForbiddenException('Contexte tenant invalide.');
    }

    if (!scopedDepotId || scopedDepotId !== depotId) {
      throw new ForbiddenException('Contexte dépôt invalide.');
    }
  }

  async create(dto: any, tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);

    return this.prisma.client
      .create({
        data: {
          nom: dto.nom,
          telephone: normalizeChannelId(dto.telephone),
          adresse: dto.adresse || null,
          plafondCredit: Number(dto.plafondCredit) || 0,
          instagramId: normalizeChannelId(dto.instagramId),
          messengerId: normalizeChannelId(dto.messengerId),
          tenantId,
          depotId: effectiveDepotId,
          // §7 : un client créé par un commercial lui est rattaché
          // (« mes clients »). Créé par un autre rôle → client partagé.
          ...(this.depotScope.isCommercial() && this.depotScope.getUserId()
            ? { commercialId: this.depotScope.getUserId() as string }
            : {}),
        },
      })
      .catch(mapUniqueViolation);
  }

  async update(id: string, tenantId: string, dto: any, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);

    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, depotId: effectiveDepotId },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    return this.prisma.client
      .update({
        where: { id },
        data: {
          nom: dto.nom !== undefined ? String(dto.nom).trim() : client.nom,
          telephone:
            dto.telephone !== undefined
              ? normalizeChannelId(dto.telephone)
              : client.telephone,
          adresse:
            dto.adresse !== undefined ? dto.adresse || null : client.adresse,
          plafondCredit:
            dto.plafondCredit !== undefined
              ? Number(dto.plafondCredit) || 0
              : client.plafondCredit,
          // Canaux CRM : '' efface, undefined laisse inchangé (convention DTO).
          instagramId:
            dto.instagramId !== undefined
              ? normalizeChannelId(dto.instagramId)
              : client.instagramId,
          messengerId:
            dto.messengerId !== undefined
              ? normalizeChannelId(dto.messengerId)
              : client.messengerId,
          // metaData volontairement intouchable ici : propriété exclusive du
          // service CRM (deep merge atomique, contrainte n°6).
          // Le dépôt d'un client ne peut pas être changé arbitrairement par le payload.
          depotId: client.depotId,
        },
      })
      .catch(mapUniqueViolation);
  }

  async findAll(tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    const where: {
      tenantId: string;
      depotId: string;
      commercialId?: string;
    } = { tenantId, depotId: effectiveDepotId };
    // §7 : un commercial ne voit que SON portefeuille de clients.
    if (this.depotScope.isCommercial() && this.depotScope.getUserId())
      where.commercialId = this.depotScope.getUserId() as string;
    // Projection avec compteurs : la colonne « Achats » du back-office lit
    // `_count.ventes` (elle affichait 0 avant car aucun include n'était chargé).
    return this.prisma.client.findMany({
      where,
      orderBy: { nom: 'asc' },
      include: { _count: { select: { ventes: true } } },
    });
  }

  async findOne(id: string, tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    const where: {
      id: string;
      tenantId: string;
      depotId: string;
      commercialId?: string;
    } = { id, tenantId, depotId: effectiveDepotId };
    // §7 : un commercial n'accède qu'à SON portefeuille de clients.
    if (this.depotScope.isCommercial() && this.depotScope.getUserId())
      where.commercialId = this.depotScope.getUserId() as string;
    return this.prisma.client.findFirst({ where });
  }

  async payerDette(
    id: string,
    montant: number,
    tenantId: string,
    depotId?: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    if (!Number.isFinite(montant) || montant <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: { id, tenantId, depotId: effectiveDepotId },
      });
      if (!client) throw new NotFoundException('Client introuvable');
      if (montant > client.soldeCredit) {
        throw new BadRequestException(
          'Le montant dépasse le solde crédit du client',
        );
      }

      const updated = await tx.client.update({
        where: { id },
        data: { soldeCredit: { decrement: montant } },
      });

      const dette = await tx.detteClient.create({
        data: {
          montant,
          montantPaye: montant,
          statut: 'SOLDEE',
          clientId: id,
          tenantId,
          depotId: effectiveDepotId,
        },
      });

      return { client: updated, dette };
    });

    return result;
  }

  async statsArdoise(tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    return this.prisma.client.aggregate({
      where: { tenantId, depotId: effectiveDepotId },
      _sum: { soldeCredit: true },
    });
  }

  /**
   * Historique d'achats paginé (keyset) pour la fiche client du back-office.
   *
   * Réutilise le curseur opaque du service CRM (mêmes garanties : pas de
   * doublon ni de trou si une vente est créée pendant la navigation) et
   * respecte la limite par défaut configurée par le shop dans
   * `Tenant.parametres.crm.history.defaultLimit` (contrainte n°12).
   *
   * Portée : tenant + dépôt + portefeuille du commercial (via findOne), donc
   * un commercial ne peut pas lire l'historique d'un client hors de son scope.
   */
  async historique(
    id: string,
    tenantId: string,
    depotId?: string,
    limitRaw?: number,
    cursorRaw?: string,
  ): Promise<{
    items: {
      id: string;
      reference: string;
      date: string;
      statut: string;
      modePaiement: string;
      total: string;
    }[];
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);

    const client = await this.findOne(id, tenantId, depotId);
    if (!client) throw new NotFoundException('Client introuvable');

    // Limite par défaut = réglage métier du shop, jamais une constante.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { parametres: true },
    });
    const settings = this.crmSettings.resolve(tenant?.parametres);
    const requested = Number.isFinite(limitRaw)
      ? Math.trunc(limitRaw as number)
      : settings.history.defaultLimit;
    const limit = Math.min(Math.max(requested, 1), settings.history.maxLimit);

    let cursor: { date: string; id: string } | null = null;
    if (cursorRaw) {
      try {
        cursor = decodeHistoryCursor(cursorRaw);
      } catch {
        throw new BadRequestException('Curseur de pagination invalide.');
      }
    }

    const rows = await this.prisma.vente.findMany({
      where: {
        tenantId,
        clientId: id,
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
      take: limit + 1,
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
    const page: ClientSaleRow[] = (hasMore ? rows.slice(0, limit) : rows) as ClientSaleRow[];

    return {
      items: page.map((row) => ({
        id: row.id,
        reference: row.reference,
        date: row.date.toISOString(),
        statut: row.statut,
        modePaiement: row.modePaiement,
        // Montant sérialisé en chaîne fixe : jamais un flottant brut dans la
        // réponse d'un ERP financier.
        total: Number(row.total).toFixed(2),
      })),
      limit,
      hasMore,
      nextCursor:
        hasMore && page.length
          ? Buffer.from(
              JSON.stringify({
                d: page[page.length - 1].date.toISOString(),
                i: page[page.length - 1].id,
              }),
              'utf8',
            ).toString('base64url')
          : null,
    };
  }

  /**
   * Suppression d'un client : refusée s'il a un historique commercial
   * (ventes / ardoise / contenants en circulation). Un client « paperassé »
   * est une donnée comptable, pas un enregistrement jetable.
   */
  async remove(id: string, tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);

    const client = await this.findOne(id, tenantId, depotId);
    if (!client) throw new NotFoundException('Client introuvable');

    const [ventes, consignes, dettesOuvertes] = await Promise.all([
      this.prisma.vente.count({ where: { clientId: id, tenantId } }),
      this.prisma.portefeuilleConsigne.count({
        where: { clientId: id, quantite: { not: 0 } },
      }),
      this.prisma.detteClient.count({
        where: { clientId: id, statut: { not: 'SOLDEE' } },
      }),
    ]);

    if (
      ventes > 0 ||
      consignes > 0 ||
      dettesOuvertes > 0 ||
      client.soldeCredit > 0
    ) {
      throw new ConflictException(
        "Impossible de supprimer : ce client possède un historique commercial (ventes, ardoise ou contenants en circulation).",
      );
    }

    await this.prisma.client.delete({ where: { id } }).catch((error: unknown) => {
      // Filet de sécurité : toute autre table référencant ce client bloque la
      // suppression (FK Restrict par défaut) — on expose un 409 cohérent.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Impossible de supprimer : des documents référencent encore ce client.',
        );
      }
      throw error;
    });

    return { deleted: true };
  }
}
