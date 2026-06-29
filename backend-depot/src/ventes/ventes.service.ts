import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  StatutVente,
  TypeMouvement,
  NotifType,
  ModePaiement,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma.service';
import { DlcService } from '../dlc/dlc.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { UpdateVenteDto } from './dto/update-vente.dto';

@Injectable()
export class VentesService {
  private readonly logger = new Logger(VentesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly dlcService: DlcService,
    private readonly notifService: NotificationsService,
  ) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException(
        'depotId est obligatoire pour isoler les ventes du depot actif.',
      );
    }

    return depotId;
  }

  // 1. CRÉATION DE VENTE
  async createVente(
    dto: any,
    actor: { userId: string; email: string; role: string },
  ) {
    const {
      id,
      reference: clientRef,
      createdAt,
      depotId,
      tenantId,
      lignes,
      clientId,
      modePaiement,
      tourneeId,
      retoursConsigne,
    } = dto;

    return await this.prisma.$transaction(async (tx) => {
      let totalVente = 0;
      const lignesData: any[] = [];

      for (const ligne of lignes) {
        const article = await tx.article.findUnique({
          where: { id: ligne.articleId },
        });
        if (!article) throw new BadRequestException(`Article introuvable.`);

        const prixBase =
          ligne.casierMixte || ligne.conditionnementId
            ? ligne.prix || article.prixVente
            : article.prixVente;
        const totalLigne = prixBase * ligne.quantite - (ligne.remise || 0);
        totalVente += totalLigne;

        lignesData.push({
          id: ligne.id || undefined,
          articleId: article.id,
          quantite: ligne.quantite,
          prix: prixBase,
          remise: ligne.remise || 0,
          total: totalLigne,
          casierMixte: ligne.casierMixte || false,
          composition: ligne.composition || null,
          conditionnementId: ligne.conditionnementId || null,
        });
      }

      let reference = clientRef;
      if (!reference) {
        const annee = new Date().getFullYear();
        const count = await tx.vente.count({
          where: {
            tenantId,
            depotId,
            date: { gte: new Date(`${annee}-01-01`) },
          },
        });
        reference = `FAC-${annee}-${String(count + 1).padStart(6, '0')}`;
      }

      // Création de la vente (Statut PAYE par défaut pour le POS)
      const vente = await tx.vente.create({
        data: {
          id: id || undefined,
          reference,
          total: totalVente,
          statut: StatutVente.PAYE,
          modePaiement: modePaiement || ModePaiement.CASH,
          depotId,
          tenantId,
          createurId: actor.userId,
          clientId: clientId || null,
          tourneeId: tourneeId || null,
          date: createdAt ? new Date(createdAt) : undefined,
          lignes: { create: lignesData },
        },
        include: { lignes: { include: { article: true } }, client: true },
      });

      // --- LOGIQUE ATOMIQUE : STOCKS ET MOUVEMENTS ---
      for (const ligne of lignesData) {
        // 1. Mise à jour physique du stock
        await tx.stock.upsert({
          where: { articleId_depotId: { articleId: ligne.articleId, depotId } },
          update: { quantite: { decrement: ligne.quantite } },
          create: {
            articleId: ligne.articleId,
            depotId,
            quantite: -ligne.quantite,
          },
        });

        // 2. Création du Mouvement de Stock (Pour le Dashboard)
        await tx.mouvementStock.create({
          data: {
            type: TypeMouvement.SORTIE_VENTE,
            quantite: ligne.quantite,
            articleId: ligne.articleId,
            depotId,
            tenantId,
            motif: `Vente POS ${reference}`,
          },
        });
      }

      // --- LOGIQUE ATOMIQUE : CONSIGNES (RETOURS VIDES) ---
      if (retoursConsigne && Array.isArray(retoursConsigne) && clientId) {
        for (const retour of retoursConsigne) {
          await tx.mouvementConsigne.create({
            data: {
              quantite: retour.quantite,
              motif: `Retour vide sur vente ${reference}`,
              estSortie: false, // C'est un retour, donc ce n'est pas une sortie
              tenantId: tenantId,
              typeConsigne: { connect: { id: retour.typeConsigneId } },
            },
          });

          // Mise à jour du portefeuille consigne du client
          await tx.portefeuilleConsigne.upsert({
            where: {
              clientId_typeConsigneId: {
                clientId,
                typeConsigneId: retour.typeConsigneId,
              },
            },
            update: { quantite: { decrement: retour.quantite } },
            create: {
              clientId,
              typeConsigneId: retour.typeConsigneId,
              quantite: -retour.quantite,
            },
          });
        }
      }

      // Audit remise
      const remiseTotale = lignes.reduce(
        (acc: number, l: any) => acc + (l.remise || 0),
        0,
      );
      if (remiseTotale > 0) {
        await this.auditService.logEvent({
          tenantId,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'REMISE_ACCORDEE',
          targetType: 'VENTE',
          targetId: vente.id,
          reference: vente.reference,
          description: `Vente avec remise totale de ${remiseTotale.toLocaleString('fr-FR')} FCFA`,
          metadata: { remiseTotale, venteId: vente.id },
        });
      }

      return vente;
    });
  }

  // 2. VALIDATION (SORTIE STOCK) + FIFO
  async validerSortieVente(
    id: string,
    tenantId: string,
    depotId: string,
    actor: any,
  ) {
    const selectedDepotId = this.requireDepotId(depotId);

    return await this.prisma.$transaction(async (tx) => {
      const vente = await tx.vente.findFirst({
        where: { id, tenantId, depotId: selectedDepotId },
        include: { lignes: true },
      });

      if (!vente || vente.statut !== StatutVente.ATTENTE) {
        throw new BadRequestException('Vente introuvable ou déjà validée.');
      }

      for (const ligne of vente.lignes) {
        let stockDecs: { articleId: string; quantite: number }[] = [];
        const composition = ligne.composition
          ? typeof ligne.composition === 'string'
            ? JSON.parse(ligne.composition)
            : ligne.composition
          : null;

        if (ligne.casierMixte && composition && Array.isArray(composition)) {
          stockDecs = composition.map((item: any) => ({
            articleId: item.articleId,
            quantite: item.quantite * ligne.quantite,
          }));
        } else if (ligne.conditionnementId) {
          const cond = await tx.conditionnement.findUnique({
            where: { id: ligne.conditionnementId },
          });
          const factor = cond ? cond.quantiteUnitaire : 1;
          stockDecs = [
            { articleId: ligne.articleId, quantite: ligne.quantite * factor },
          ];
        } else {
          stockDecs = [
            { articleId: ligne.articleId, quantite: ligne.quantite },
          ];
        }

        for (const dec of stockDecs) {
          if (vente.tourneeId) {
            // Vente en tournée : Tricycle stock
            const ligneCh = await tx.ligneChargement.findFirst({
              where: { tourneeId: vente.tourneeId, articleId: dec.articleId },
            });

            if (!ligneCh)
              throw new BadRequestException(
                `Article ${dec.articleId} non chargé.`,
              );

            await tx.ligneChargement.update({
              where: { id: ligneCh.id },
              data: { quantiteVendue: { increment: dec.quantite } },
            });
          } else {
            // Vente au dépôt : FIFO automatique
            await tx.stock.upsert({
              where: {
                articleId_depotId: {
                  articleId: dec.articleId,
                  depotId: vente.depotId,
                },
              },
              update: { quantite: { decrement: dec.quantite } },
              create: {
                articleId: dec.articleId,
                depotId: vente.depotId,
                quantite: -dec.quantite,
              },
            });

            // FIFO des lots
            await this.dlcService.deduireLotFIFO(
              dec.articleId,
              vente.depotId,
              tenantId,
              dec.quantite,
            );
          }

          await tx.mouvementStock.create({
            data: {
              type: TypeMouvement.SORTIE_VENTE,
              quantite: dec.quantite,
              articleId: dec.articleId,
              depotId: vente.depotId,
              tenantId,
              motif: `Vente ${vente.reference}`,
              tourneeId: vente.tourneeId || null,
            },
          });
        }
      }

      const venteUpdated = await tx.vente.update({
        where: { id },
        data: { statut: StatutVente.PAYE },
      });

      await this.auditService.logEvent({
        tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'VALIDATION_STOCK_MAGASINIER',
        targetType: 'VENTE',
        targetId: id,
        reference: vente.reference,
        description: `Validation sortie de stock ${vente.reference}`,
        metadata: { venteId: id },
      });

      this.notifService
        .createFromTemplate(tenantId, NotifType.LIVRAISON_TERMINEE, {
          client: vente.clientId || 'Client',
          montant: vente.total,
        })
        .catch((e) => this.logger.error(`Erreur notif vente: ${e.message}`));

      return venteUpdated;
    });
  }

  // 3. STATISTIQUES
  async getStats(tenantId: string, depotId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const infosJour = await this.prisma.vente.aggregate({
      where: {
        tenantId,
        depotId,
        date: { gte: today },
        statut: StatutVente.PAYE,
      },
      _sum: { total: true },
      _count: { _all: true },
    });

    return {
      caJour: infosJour._sum?.total || 0,
      nbVentesJour: infosJour._count?._all || 0,
    };
  }

  // 4. LISTER VENTES
  async findAll(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    depotId?: string,
    statut?: any,
  ) {
    const selectedDepotId = this.requireDepotId(depotId);
    const where: any = { tenantId, depotId: selectedDepotId };
    if (statut) where.statut = statut;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.vente.findMany({
      where,
      include: {
        lignes: { include: { article: true } },
        client: true,
        depot: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  // 5. TROUVER VENTE
  async findOne(id: string, tenantId: string, depotId: string) {
    return this.prisma.vente.findFirst({
      where: { id, tenantId, depotId },
      include: { lignes: { include: { article: true } }, client: true },
    });
  }

  // 6. EN ATTENTE
  async findEnAttenteValidation(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    return this.prisma.vente.findMany({
      where: {
        tenantId,
        depotId: selectedDepotId,
        statut: StatutVente.ATTENTE,
      },
      include: { lignes: { include: { article: true } }, depot: true },
      orderBy: { date: 'desc' },
    });
  }

  // 7. ANNULER VENTE
  async annulerVente(
    id: string,
    motif: string,
    tenantId: string,
    depotId: string,
    actor: any,
  ) {
    const selectedDepotId = this.requireDepotId(depotId);

    return await this.prisma.$transaction(async (tx) => {
      const vente = await tx.vente.findFirst({
        where: { id, tenantId, depotId: selectedDepotId },
        include: { lignes: true },
      });
      if (!vente || vente.statut === StatutVente.ANNULE)
        throw new BadRequestException('Action impossible');

      if (vente.statut === StatutVente.PAYE) {
        for (const ligne of vente.lignes) {
          let stockIncs: { articleId: string; quantite: number }[] = [];
          const composition = ligne.composition
            ? typeof ligne.composition === 'string'
              ? JSON.parse(ligne.composition)
              : ligne.composition
            : null;

          if (ligne.casierMixte && composition && Array.isArray(composition)) {
            stockIncs = composition.map((item: any) => ({
              articleId: item.articleId,
              quantite: item.quantite * ligne.quantite,
            }));
          } else if (ligne.conditionnementId) {
            const cond = await tx.conditionnement.findUnique({
              where: { id: ligne.conditionnementId },
            });
            const factor = cond ? cond.quantiteUnitaire : 1;
            stockIncs = [
              { articleId: ligne.articleId, quantite: ligne.quantite * factor },
            ];
          } else {
            stockIncs = [
              { articleId: ligne.articleId, quantite: ligne.quantite },
            ];
          }

          for (const inc of stockIncs) {
            await tx.stock.upsert({
              where: {
                articleId_depotId: {
                  articleId: inc.articleId,
                  depotId: vente.depotId,
                },
              },
              update: { quantite: { increment: inc.quantite } },
              create: {
                articleId: inc.articleId,
                depotId: vente.depotId,
                quantite: inc.quantite,
              },
            });
          }
        }
      }

      const venteUpdated = await tx.vente.update({
        where: { id },
        data: { statut: StatutVente.ANNULE, motifAnnulation: motif },
      });

      await this.auditService.logEvent({
        tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'VENTE_ANNULEE',
        targetType: 'VENTE',
        targetId: id,
        reference: vente.reference,
        description: `Annulation vente ${vente.reference}`,
        metadata: { motif, venteId: id },
      });

      return venteUpdated;
    });
  }

  // 8. PUT /:id — Mise à jour statut vente (Phase 4)
  async update(tenantId: string, id: string, dto: UpdateVenteDto) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
    });

    if (!vente) {
      throw new NotFoundException(`Vente with ID ${id} not found`);
    }

    return this.prisma.vente.update({
      where: { id },
      data: { ...dto },
    });
  }

  // 9. GET /caisse — État de la caisse du jour (Phase 4)
  async getCaisse(tenantId: string, depotId: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ventes = await this.prisma.vente.aggregate({
      where: {
        tenantId,
        depotId: selectedDepotId,
        date: { gte: today },
        statut: StatutVente.PAYE,
      },
      _sum: { total: true },
      _count: true,
    });

    return {
      montantTotal: ventes._sum?.total ?? 0,
      nombreVentes: ventes._count,
      date: today,
    };
  }
}
