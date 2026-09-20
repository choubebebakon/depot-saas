import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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

  /**
   * Normalise l'identifiant d'un poste de caisse (CAISSE_1, CAISSE_2…).
   * Le multi-caisse est rétro-compatible : sans posteId explicite, le poste
   * historique unique « CAISSE_1 » est utilisé.
   */
  private normalizePosteId(raw: unknown): string {
    const posteId =
      typeof raw === 'string' ? raw.trim().toUpperCase() : '';
    if (!posteId) return 'CAISSE_1';
    if (!/^[A-Z0-9_-]{1,50}$/.test(posteId)) {
      throw new BadRequestException(
        'Identifiant de poste de caisse invalide (caractères autorisés : A-Z, 0-9, _ et -).',
      );
    }
    return posteId;
  }

  async ouvrirSession(dto: OuvrirCaisseDto) {
    if (!dto.depotId || !dto.tenantId || !dto.userId) {
      throw new BadRequestException('Contexte de caisse incomplet.');
    }

    this.assertScope(dto.tenantId, dto.depotId);
    const posteId = this.normalizePosteId(dto.posteId);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const sessionExistante = await tx.sessionCaisse.findFirst({
            where: {
              depotId: dto.depotId,
              tenantId: dto.tenantId,
              posteId,
              estOuverte: true,
            },
          });

          if (sessionExistante) {
            throw new BadRequestException(
              `Une session de caisse est déjà ouverte sur le poste ${posteId} de ce dépôt.`,
            );
          }

          const session = await tx.sessionCaisse.create({
            data: {
              fondInitial: dto.fondInitial,
              depotId: dto.depotId!,
              userId: dto.userId!,
              tenantId: dto.tenantId!,
              posteId,
              estOuverte: true,
            },
          });

          await tx.mouvementCaisse.create({
            data: {
              type: 'FOND_INITIAL',
              montant: dto.fondInitial,
              motif: `Ouverture de caisse (poste ${posteId})`,
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
      // Course perdue au niveau de l'index partiel unique
      // (depotId, posteId) WHERE estOuverte : un autre poste a ouvert
      // entre-temps côté concurrent.
      if ((error as any)?.code === 'P2002') {
        throw new BadRequestException(
          `Une session de caisse vient d'être ouverte sur le poste ${posteId}.`,
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

      // Réconciliation des encaissements cash :
      //  - ventes rattachées à CETTE session (multi-caisse) ;
      //  - repli legacy : ventes du dépôt sans session, ouvertes depuis
      //    l'ouverture de la session (les ventes des autres postes, qui ont
      //    leur propre sessionId, ne sont jamais comptabilisées deux fois).
      const ventesSession = await tx.vente.aggregate({
        where: {
          tenantId: dto.tenantId,
          depotId: dto.depotId,
          statut: StatutVente.PAYE,
          OR: [
            { sessionId: session.id },
            { sessionId: null, date: { gte: session.dateOuverture } },
          ],
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

  async getSessionActive(tenantId: string, depotId: string, posteId?: string) {
    this.assertScope(tenantId, depotId);
    return this.prisma.sessionCaisse.findFirst({
      where: {
        tenantId,
        depotId,
        estOuverte: true,
        ...(posteId ? { posteId: this.normalizePosteId(posteId) } : {}),
      },
      include: {
        mouvements: { orderBy: { createdAt: 'desc' } },
        user: { select: { email: true, role: true } },
      },
    });
  }

  /**
   * Liste des sessions actuellement ouvertes sur le dépôt (tous postes),
   * utilisée par le sélecteur de poste du POS multi-caisse.
   */
  async getSessionsOuvertes(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);
    return this.prisma.sessionCaisse.findMany({
      where: { tenantId, depotId, estOuverte: true },
      select: {
        id: true,
        posteId: true,
        dateOuverture: true,
        fondInitial: true,
        user: { select: { email: true } },
      },
      orderBy: { posteId: 'asc' },
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

  async createDepense(
    dto: CreateDepenseDto & { tenantId: string; depotId: string },
  ) {
    this.assertScope(dto.tenantId, dto.depotId);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const categorie = dto.categorie.trim();
          const motif = dto.motif.trim();
          const photoUrl = dto.photoUrl?.trim() || null;

          // L'ID client sert uniquement de clé d'idempotence pour les retries
          // offline. Une même clé avec un payload différent est un conflit,
          // jamais une autorisation de réutiliser silencieusement une dépense.
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

              const memePayload =
                existante.categorie === categorie &&
                existante.montant === dto.montant &&
                existante.motif === motif &&
                (existante.photoUrl || null) === photoUrl;

              if (!memePayload) {
                throw new BadRequestException(
                  'Identifiant de dépense déjà utilisé avec des données différentes.',
                );
              }

              return existante;
            }
          }

          // En multi-caisse, la dépense est débitée du poste qui l'exécute.
          // Sans posteId (clients legacy), on retombe sur n'importe quelle
          // session ouverte du dépôt (comportement historique conservé).
          const session = await tx.sessionCaisse.findFirst({
            where: {
              depotId: dto.depotId,
              tenantId: dto.tenantId,
              estOuverte: true,
              ...(dto.posteId
                ? { posteId: this.normalizePosteId(dto.posteId) }
                : {}),
            },
          });

          if (!session) {
            throw new BadRequestException(
              dto.posteId
                ? `Impossible d'enregistrer une dépense : aucune caisse ouverte sur le poste ${this.normalizePosteId(dto.posteId)}.`
                : 'Impossible d’enregistrer une dépense sans caisse ouverte sur ce dépôt.',
            );
          }

          // Le montant disponible est calculé dans la même transaction que
          // l'écriture de la dépense. L'isolation Serializable empêche deux
          // dépenses concurrentes de faire passer la caisse sous zéro.
          const entrees = await tx.mouvementCaisse.aggregate({
            where: {
              sessionId: session.id,
              type: {
                in: [
                  'FOND_INITIAL',
                  'ENCAISSEMENT_VENTE',
                  'ENCAISSEMENT_DETTE',
                ],
              },
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

          // Solde cash du poste uniquement (les ventes des autres postes
          // ont leur propre sessionId et ne gonflent pas cette caisse).
          const cashVentes = await tx.vente.aggregate({
            where: {
              tenantId: dto.tenantId,
              depotId: dto.depotId,
              statut: StatutVente.PAYE,
              OR: [
                { sessionId: session.id },
                { sessionId: null, date: { gte: session.dateOuverture } },
              ],
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
              categorie,
              montant: dto.montant,
              motif,
              depotId: dto.depotId,
              tenantId: dto.tenantId,
              photoUrl: photoUrl || undefined,
            },
          });

          await tx.mouvementCaisse.create({
            data: {
              type: 'DECAISSEMENT_DEPENSE',
              montant: dto.montant,
              motif: `${categorie} — ${motif}`,
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
      let debut: Date | undefined;
      let fin: Date | undefined;

      if (dateDebut) {
        debut = new Date(dateDebut);
        if (Number.isNaN(debut.getTime())) {
          throw new BadRequestException('dateDebut invalide.');
        }
        where.createdAt.gte = debut;
      }

      if (dateFin) {
        fin = new Date(dateFin);
        if (Number.isNaN(fin.getTime())) {
          throw new BadRequestException('dateFin invalide.');
        }
        fin.setHours(23, 59, 59, 999);
        where.createdAt.lte = fin;
      }

      if (debut && fin && debut > fin) {
        throw new BadRequestException(
          'La dateDebut doit être antérieure à la dateFin.',
        );
      }
    }

    return this.prisma.depense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // ── Résumé caisse du jour ────────────────────────────────

  async getResume(tenantId: string, depotId: string, posteId?: string) {
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

    // Session du poste demandé (défaut CAISSE_1) + vue consolidée de tous
    // les postes ouverts du dépôt pour l'interface multi-caisse.
    const sessionActive = await this.getSessionActive(tenantId, depotId, posteId);
    const sessionsOuvertes = await this.getSessionsOuvertes(tenantId, depotId);

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
      posteId: sessionActive?.posteId || null,
      fondInitial: sessionActive?.fondInitial || 0,
      sessionsOuvertes,
    };
  }
}
