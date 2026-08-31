import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, StatutVente } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';
import {
  OuvrirCaisseDto,
  FermerCaisseDto,
  CreateDepenseDto,
} from './dto/caisse.dto';

@Injectable()
export class CaisseService {
  constructor(
    private prisma: PrismaService,
    private readonly depotScope: DepotScopeService,
  ) {}

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

  // ── Sessions Caisse ──────────────────────────────────────

  async ouvrirSession(dto: OuvrirCaisseDto) {
    if (!dto.depotId || !dto.tenantId || !dto.userId) {
      throw new BadRequestException('Contexte de caisse incomplet.');
    }

    this.assertScope(dto.tenantId, dto.depotId);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const sessionExistante = await tx.sessionCaisse.findFirst({
            where: {
              depotId: dto.depotId,
              tenantId: dto.tenantId,
              estOuverte: true,
            },
          });

          if (sessionExistante) {
            throw new BadRequestException(
              'Une session de caisse est déjà ouverte sur ce Depot.',
            );
          }

          const session = await tx.sessionCaisse.create({
            data: {
              fondInitial: dto.fondInitial,
              depotId: dto.depotId,
              userId: dto.userId,
              tenantId: dto.tenantId,
              estOuverte: true,
            },
          });

          await tx.mouvementCaisse.create({
            data: {
              type: 'FOND_INITIAL',
              montant: dto.fondInitial,
              motif: 'Ouverture de caisse',
              sessionId: session.id,
            },
          });

          return session;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if ((error as any)?.code === 'P2034') {
        throw new BadRequestException(
          'Une autre ouverture de caisse est en cours. Réessayez.',
        );
      }
      throw error;
    }
  }

  async fermerSession(dto: FermerCaisseDto & { depotId: string }) {
    if (!dto.tenantId || !dto.depotId) {
      throw new BadRequestException('Contexte de caisse incomplet.');
    }

    this.assertScope(dto.tenantId, dto.depotId);

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.sessionCaisse.findFirst({
        where: {
          id: dto.sessionId,
          tenantId: dto.tenantId,
          depotId: dto.depotId,
        },
        include: { mouvements: true },
      });

      if (!session) throw new BadRequestException('Session introuvable');
      if (!session.estOuverte)
        throw new BadRequestException('Session déjà fermée');

      const totalEntreesMouvements = session.mouvements
        .filter((m) =>
          ['FOND_INITIAL', 'ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE'].includes(
            m.type,
          ),
        )
        .reduce((acc, m) => acc + m.montant, 0);

      const totalSorties = session.mouvements
        .filter((m) =>
          ['DECAISSEMENT_DEPENSE', 'DECAISSEMENT_VIDES'].includes(m.type),
        )
        .reduce((acc, m) => acc + m.montant, 0);

      const ventesSession = await tx.vente.aggregate({
        where: {
          tenantId: dto.tenantId,
          depotId: dto.depotId,
          statut: StatutVente.PAYE,
          date: { gte: session.dateOuverture },
        },
        _sum: { montantCash: true },
      });

      const cashVentes = ventesSession._sum?.montantCash ?? 0;
      const cashVentesDejaMouvements = session.mouvements
        .filter((m) => m.type === 'ENCAISSEMENT_VENTE')
        .reduce((acc, m) => acc + m.montant, 0);
      const cashVentesNonComptabilisees = Math.max(
        0,
        cashVentes - cashVentesDejaMouvements,
      );

      if (cashVentesNonComptabilisees > 0) {
        await tx.mouvementCaisse.create({
          data: {
            type: 'ENCAISSEMENT_VENTE',
            montant: cashVentesNonComptabilisees,
            motif: 'Réconciliation des ventes POS à la clôture',
            reference: `RECONCILIATION_VENTES_${session.id}`,
            sessionId: session.id,
          },
        });
      }

      const totalEntrees = totalEntreesMouvements + cashVentesNonComptabilisees;
      const soldeTheorique = totalEntrees - totalSorties;
      const ecart = dto.fondFinal - soldeTheorique;

      return tx.sessionCaisse.update({
        where: { id: dto.sessionId },
        data: {
          fondFinal: dto.fondFinal,
          ecart,
          motifEcart: ecart !== 0 ? dto.motifEcart : null,
          estOuverte: false,
          dateCloture: new Date(),
        },
      });
    });
  }

  async getSessionActive(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);
    return this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId, estOuverte: true },
      include: {
        mouvements: { orderBy: { createdAt: 'desc' } },
        user: { select: { email: true, role: true } },
      },
    });
  }

  async getHistorique(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);
    return this.prisma.sessionCaisse.findMany({
      where: { tenantId, depotId },
      include: {
        _count: { select: { mouvements: true } },
        user: { select: { email: true } },
      },
      orderBy: { dateOuverture: 'desc' },
      take: 30,
    });
  }

  // ── Dépenses ─────────────────────────────────────────────

  async createDepense(dto: CreateDepenseDto & { tenantId: string; depotId: string }) {
    this.assertScope(dto.tenantId, dto.depotId);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // L'identifiant est utilisé uniquement pour rendre les retries
          // offline idempotents. Il ne permet jamais de changer le tenant ou
          // le dépôt de la dépense existante.
          if (dto.id) {
            const existante = await tx.depense.findUnique({
              where: { id: dto.id },
            });

            if (existante) {
              if (
                existante.tenantId !== dto.tenantId ||
                existante.depotId !== dto.depotId
              ) {
                throw new ForbiddenException(
                  'Cette dépense appartient à un autre périmètre.',
                );
              }
              return existante;
            }
          }

          const session = await tx.sessionCaisse.findFirst({
            where: {
              depotId: dto.depotId,
              tenantId: dto.tenantId,
              estOuverte: true,
            },
          });

          if (!session) {
            throw new BadRequestException(
              'Impossible d’enregistrer une dépense sans caisse ouverte sur ce dépôt.',
            );
          }

          // Le montant disponible est calculé dans la même transaction que
          // l'écriture de la dépense. L'isolation Serializable empêche deux
          // dépenses concurrentes de faire passer la caisse sous zéro.
          const entrees = await tx.mouvementCaisse.aggregate({
            where: {
              sessionId: session.id,
              type: { in: ['FOND_INITIAL', 'ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE'] },
            },
            _sum: { montant: true },
          });

          const sorties = await tx.mouvementCaisse.aggregate({
            where: {
              sessionId: session.id,
              type: { in: ['DECAISSEMENT_DEPENSE', 'DECAISSEMENT_VIDES'] },
            },
            _sum: { montant: true },
          });

          const cashVentes = await tx.vente.aggregate({
            where: {
              tenantId: dto.tenantId,
              depotId: dto.depotId,
              statut: StatutVente.PAYE,
              date: { gte: session.dateOuverture },
            },
            _sum: { montantCash: true },
          });

          const cashVentesMouvements = await tx.mouvementCaisse.aggregate({
            where: {
              sessionId: session.id,
              type: 'ENCAISSEMENT_VENTE',
            },
            _sum: { montant: true },
          });

          const ventesNonComptabilisees = Math.max(
            0,
            (cashVentes._sum?.montantCash ?? 0) -
              (cashVentesMouvements._sum?.montant ?? 0),
          );

          const soldeDisponible =
            (entrees._sum?.montant ?? 0) +
            ventesNonComptabilisees -
            (sorties._sum?.montant ?? 0);

          if (dto.montant > soldeDisponible) {
            throw new BadRequestException(
              `Dépense refusée : solde caisse disponible insuffisant (${soldeDisponible.toLocaleString('fr-FR')} FCFA).`,
            );
          }

          const depense = await tx.depense.create({
            data: {
              id: dto.id,
              categorie: dto.categorie.trim(),
              montant: dto.montant,
              motif: dto.motif.trim(),
              depotId: dto.depotId,
              tenantId: dto.tenantId,
              photoUrl: dto.photoUrl?.trim() || undefined,
            },
          });

          await tx.mouvementCaisse.create({
            data: {
              type: 'DECAISSEMENT_DEPENSE',
              montant: dto.montant,
              motif: `${dto.categorie.trim()} — ${dto.motif.trim()}`,
              reference: depense.id,
              sessionId: session.id,
            },
          });

          return depense;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if ((error as any)?.code === 'P2034') {
        throw new BadRequestException(
          'Une autre opération de caisse est en cours. Réessayez.',
        );
      }
      throw error;
    }
  }

  async getDepenses(
    tenantId: string,
    depotId: string,
    dateDebut?: string,
    dateFin?: string,
  ) {
    this.assertScope(tenantId, depotId);

    const where: any = { tenantId, depotId };

    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) {
        const debut = new Date(dateDebut);
        if (Number.isNaN(debut.getTime())) {
          throw new BadRequestException('dateDebut invalide.');
        }
        where.createdAt.gte = debut;
      }
      if (dateFin) {
        const fin = new Date(dateFin);
        if (Number.isNaN(fin.getTime())) {
          throw new BadRequestException('dateFin invalide.');
        }
        fin.setHours(23, 59, 59, 999);
        where.createdAt.lte = fin;
      }
    }

    return this.prisma.depense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Résumé caisse du jour ────────────────────────────────

  async getResume(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ventesJour = await this.prisma.vente.aggregate({
      where: {
        tenantId,
        depotId,
        date: { gte: today },
        statut: StatutVente.PAYE,
      },
      _sum: {
        montantCash: true,
        montantOM: true,
        montantMoMo: true,
        montantCredit: true,
        total: true,
      },
      _count: { _all: true },
    });

    const depensesJour = await this.prisma.depense.aggregate({
      where: { tenantId, depotId, createdAt: { gte: today } },
      _sum: { montant: true },
      _count: { _all: true },
    });

    const sessionActive = await this.getSessionActive(tenantId, depotId);

    return {
      ventesTotal: ventesJour._sum?.total || 0,
      ventesCash: ventesJour._sum?.montantCash || 0,
      ventesOM: ventesJour._sum?.montantOM || 0,
      ventesMoMo: ventesJour._sum?.montantMoMo || 0,
      ventesCredit: ventesJour._sum?.montantCredit || 0,
      nbVentes: ventesJour._count?._all || 0,
      depensesTotal: depensesJour._sum?.montant || 0,
      nbDepenses: depensesJour._count?._all || 0,
      soldeNet:
        (ventesJour._sum?.montantCash || 0) - (depensesJour._sum?.montant || 0),
      sessionActive: !!sessionActive,
      sessionId: sessionActive?.id || null,
      fondInitial: sessionActive?.fondInitial || 0,
    };
  }
}
