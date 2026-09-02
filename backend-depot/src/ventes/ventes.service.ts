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
      montantCash,
      montantOM,
      montantMoMo,
      montantCredit,
      tourneeId,
      retoursConsigne,
    } = dto;

    return await this.prisma.$transaction(async (tx) => {
      if (!Array.isArray(lignes) || lignes.length === 0) {
        throw new BadRequestException('Une vente doit contenir au moins une ligne.');
      }

      // Idempotence : un retry réseau avec le même UUID ne crée jamais une seconde vente.
      if (id) {
        const existing = await tx.vente.findFirst({
          where: { id, tenantId, depotId },
          include: { lignes: { include: { article: true } }, client: true },
        });
        if (existing) return existing;
      }

      let totalVente = 0;
      const lignesData: any[] = [];

      for (const ligne of lignes) {
        const quantite = Number(ligne.quantite);
        if (!Number.isFinite(quantite) || quantite <= 0) {
          throw new BadRequestException('La quantité de chaque ligne doit être supérieure à 0.');
        }
        const remise = Number(ligne.remise || 0);
        if (!Number.isFinite(remise) || remise < 0) {
          throw new BadRequestException('La remise doit être un montant positif ou nul.');
        }

        const article = await tx.article.findFirst({
          where: { id: ligne.articleId, tenantId },
        });
        if (!article) throw new BadRequestException('Article introuvable.');

        const prixBase =
          ligne.casierMixte || ligne.conditionnementId
            ? ligne.prix ?? article.prixVente
            : article.prixVente;
        if (!Number.isFinite(prixBase) || prixBase < 0) {
          throw new BadRequestException(`Prix invalide pour l'article ${article.designation}.`);
        }
        const totalLigne = prixBase * quantite - remise;
        if (totalLigne < 0) {
          throw new BadRequestException('Le total d\'une ligne ne peut pas être négatif.');
        }
        totalVente += totalLigne;
        lignesData.push({
          id: ligne.id || undefined,
          articleId: article.id,
          quantite,
          prix: prixBase,
          remise,
          total: totalLigne,
          casierMixte: ligne.casierMixte || false,
          composition: ligne.composition || null,
          conditionnementId: ligne.conditionnementId || null,
        });
      }

      const mode = modePaiement || ModePaiement.CASH;
      const montantTotal = Number(totalVente.toFixed(2));
      const cash = Number(montantCash ?? (mode === ModePaiement.CASH ? montantTotal : 0));
      const om = Number(montantOM ?? (mode === ModePaiement.ORANGE_MONEY ? montantTotal : 0));
      const momo = Number(montantMoMo ?? (mode === ModePaiement.MTN_MOMO ? montantTotal : 0));
      const credit = Number(montantCredit ?? (mode === ModePaiement.CREDIT ? montantTotal : 0));
      for (const montant of [cash, om, momo, credit]) {
        if (!Number.isFinite(montant) || montant < 0) {
          throw new BadRequestException('Les montants de paiement doivent être positifs ou nuls.');
        }
      }
      const totalPaiement = Number((cash + om + momo + credit).toFixed(2));
      if (Math.abs(totalPaiement - montantTotal) > 0.01) {
        throw new BadRequestException(
          `Paiement incohérent : ${totalPaiement} FCFA pour une vente de ${montantTotal} FCFA.`,
        );
      }
      if (mode === ModePaiement.CREDIT && !clientId) {
        throw new BadRequestException('Un client est obligatoire pour une vente à crédit.');
      }
      if (mode === ModePaiement.CASH && cash <= 0) {
        throw new BadRequestException('Le montant CASH est obligatoire pour une vente comptant.');
      }

      // Toutes les ressources sensibles doivent appartenir au scope actif.
      if (clientId) {
        const client = await tx.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new BadRequestException('Client introuvable.');
      }
      if (tourneeId) {
        const tournee = await tx.tournee.findFirst({ where: { id: tourneeId, tenantId, depotId } });
        if (!tournee) throw new BadRequestException('Tournée introuvable pour ce dépôt.');
      }

      let sessionCaisse: { id: string } | null = null;
      if (cash > 0) {
        sessionCaisse = await tx.sessionCaisse.findFirst({
          where: { tenantId, depotId, estOuverte: true },
          select: { id: true },
        });
        if (!sessionCaisse) {
          throw new BadRequestException(
            'Impossible d\'encaisser en espèces : aucune session de caisse ouverte pour ce dépôt.',
          );
        }
      }

      // Référence non séquentielle : évite la course count()+1 entre deux caisses.
      let reference = clientRef;
      if (!reference) reference = `FAC-${new Date().getFullYear()}-${id ?? crypto.randomUUID()}`;

      const vente = await tx.vente.create({
        data: {
          id: id || undefined,
          reference,
          total: montantTotal,
          statut: StatutVente.PAYE,
          modePaiement: mode,
          montantCash: cash,
          montantOM: om,
          montantMoMo: momo,
          montantCredit: credit,
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

      if (cash > 0 && sessionCaisse) {
        await tx.mouvementCaisse.create({
          data: {
            type: 'ENCAISSEMENT_VENTE',
            montant: cash,
            motif: `Encaissement vente ${reference}`,
            reference: vente.id,
            sessionId: sessionCaisse.id,
          },
        });
      }

      // Décrément conditionnel : jamais de création d'un stock négatif.
      for (const ligne of lignesData) {
        const updated = await tx.stock.updateMany({
          where: {
            articleId: ligne.articleId,
            depotId,
            quantite: { gte: ligne.quantite },
          },
          data: { quantite: { decrement: ligne.quantite } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(
            `Stock insuffisant pour l'article ${ligne.articleId}. La vente n'a pas été enregistrée.`,
          );
        }
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

      if (retoursConsigne && Array.isArray(retoursConsigne) && clientId) {
        for (const retour of retoursConsigne) {
          const portefeuille = await tx.portefeuilleConsigne.findUnique({
            where: { clientId_typeConsigneId: { clientId, typeConsigneId: retour.typeConsigneId } },
          });
          if (!portefeuille || portefeuille.quantite < retour.quantite) {
            throw new BadRequestException('Quantité de consignes retournées supérieure au portefeuille client.');
          }
          const typeConsigne = await tx.typeConsigne.findFirst({
            where: { id: retour.typeConsigneId, tenantId },
          });
          if (!typeConsigne) throw new BadRequestException('Type de consigne introuvable.');
          await tx.mouvementConsigne.create({
            data: {
              quantite: retour.quantite,
              motif: `Retour vide sur vente ${reference}`,
              estSortie: false,
              tenantId,
              typeConsigne: { connect: { id: retour.typeConsigneId } },
            },
          });
          await tx.portefeuilleConsigne.update({
            where: { clientId_typeConsigneId: { clientId, typeConsigneId: retour.typeConsigneId } },
            data: { quantite: { decrement: retour.quantite } },
          });
        }
      }

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

  async validerSortieVente(id: string, tenantId: string, depotId: string, actor: any) {
    const selectedDepotId = this.requireDepotId(depotId);
    return await this.prisma.$transaction(async (tx) => {
      const vente = await tx.vente.findFirst({ where: { id, tenantId, depotId: selectedDepotId }, include: { lignes: true } });
      if (!vente || vente.statut !== StatutVente.ATTENTE) throw new BadRequestException('Vente introuvable ou déjà validée.');
      for (const ligne of vente.lignes) {
        let stockDecs: { articleId: string; quantite: number }[] = [];
        const composition = ligne.composition
          ? typeof ligne.composition === 'string' ? JSON.parse(ligne.composition) : ligne.composition : null;
        if (ligne.casierMixte && composition && Array.isArray(composition)) {
          stockDecs = composition.map((item: any) => ({ articleId: item.articleId, quantite: item.quantite * ligne.quantite }));
        } else if (ligne.conditionnementId) {
          const cond = await tx.conditionnement.findUnique({ where: { id: ligne.conditionnementId } });
          const factor = cond ? cond.quantiteUnitaire : 1;
          stockDecs = [{ articleId: ligne.articleId, quantite: ligne.quantite * factor }];
        } else stockDecs = [{ articleId: ligne.articleId, quantite: ligne.quantite }];
        for (const dec of stockDecs) {
          if (vente.tourneeId) {
            const ligneCh = await tx.ligneChargement.findFirst({ where: { tourneeId: vente.tourneeId, articleId: dec.articleId } });
            if (!ligneCh) throw new BadRequestException(`Article ${dec.articleId} non chargé.`);
            await tx.ligneChargement.update({ where: { id: ligneCh.id }, data: { quantiteVendue: { increment: dec.quantite } } });
          } else {
            const updated = await tx.stock.updateMany({ where: { articleId: dec.articleId, depotId: vente.depotId, quantite: { gte: dec.quantite } }, data: { quantite: { decrement: dec.quantite } } });
            if (updated.count !== 1) throw new BadRequestException(`Stock insuffisant pour l'article ${dec.articleId}.`);
            await this.dlcService.deduireLotFIFO(dec.articleId, vente.depotId, tenantId, dec.quantite);
          }
          await tx.mouvementStock.create({ data: { type: TypeMouvement.SORTIE_VENTE, quantite: dec.quantite, articleId: dec.articleId, depotId: vente.depotId, tenantId, motif: `Vente ${vente.reference}`, tourneeId: vente.tourneeId || null } });
        }
      }
      const venteUpdated = await tx.vente.update({ where: { id }, data: { statut: StatutVente.PAYE } });
      await this.auditService.logEvent({ tenantId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: 'VALIDATION_STOCK_MAGASINIER', targetType: 'VENTE', targetId: id, reference: vente.reference, description: `Validation sortie de stock ${vente.reference}`, metadata: { venteId: id } });
      this.notifService.createFromTemplate(tenantId, NotifType.LIVRAISON_TERMINEE, { client: vente.clientId || 'Client', montant: vente.total }).catch((e) => this.logger.error(`Erreur notif vente: ${e.message}`));
      return venteUpdated;
    });
  }

  async getStats(tenantId: string, depotId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const infosJour = await this.prisma.vente.aggregate({ where: { tenantId, depotId, date: { gte: today }, statut: StatutVente.PAYE }, _sum: { total: true }, _count: { _all: true } });
    return { caJour: infosJour._sum?.total || 0, nbVentesJour: infosJour._count?._all || 0 };
  }

  async findAll(tenantId: string, startDate?: string, endDate?: string, depotId?: string, statut?: any) {
    const selectedDepotId = this.requireDepotId(depotId);
    const where: any = { tenantId, depotId: selectedDepotId };
    if (statut) where.statut = statut;
    if (startDate || endDate) { where.date = {}; if (startDate) where.date.gte = new Date(startDate); if (endDate) where.date.lte = new Date(endDate); }
    return this.prisma.vente.findMany({ where, include: { lignes: { include: { article: true } }, client: true, depot: true }, orderBy: { date: 'desc' } });
  }

  async findOne(id: string, tenantId: string, depotId: string) {
    return this.prisma.vente.findFirst({ where: { id, tenantId, depotId }, include: { lignes: { include: { article: true } }, client: true } });
  }

  async findEnAttenteValidation(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    return this.prisma.vente.findMany({ where: { tenantId, depotId: selectedDepotId, statut: StatutVente.ATTENTE }, include: { lignes: { include: { article: true } }, depot: true }, orderBy: { date: 'desc' } });
  }

  async annulerVente(id: string, motif: string, tenantId: string, depotId: string, actor: any) {
    const selectedDepotId = this.requireDepotId(depotId);
    return await this.prisma.$transaction(async (tx) => {
      const vente = await tx.vente.findFirst({ where: { id, tenantId, depotId: selectedDepotId }, include: { lignes: true } });
      if (!vente || vente.statut === StatutVente.ANNULE) throw new BadRequestException('Action impossible');
      if (vente.statut === StatutVente.PAYE) {
        for (const ligne of vente.lignes) {
          let stockIncs: { articleId: string; quantite: number }[] = [];
          const composition = ligne.composition ? typeof ligne.composition === 'string' ? JSON.parse(ligne.composition) : ligne.composition : null;
          if (ligne.casierMixte && composition && Array.isArray(composition)) stockIncs = composition.map((item: any) => ({ articleId: item.articleId, quantite: item.quantite * ligne.quantite }));
          else if (ligne.conditionnementId) {
            const cond = await tx.conditionnement.findUnique({ where: { id: ligne.conditionnementId } });
            stockIncs = [{ articleId: ligne.articleId, quantite: ligne.quantite * (cond ? cond.quantiteUnitaire : 1) }];
          } else stockIncs = [{ articleId: ligne.articleId, quantite: ligne.quantite }];
          for (const inc of stockIncs) await tx.stock.upsert({ where: { articleId_depotId: { articleId: inc.articleId, depotId: vente.depotId } }, update: { quantite: { increment: inc.quantite } }, create: { articleId: inc.articleId, depotId: vente.depotId, quantite: inc.quantite } });
        }
      }
      const venteUpdated = await tx.vente.update({ where: { id }, data: { statut: StatutVente.ANNULE, motifAnnulation: motif } });
      await this.auditService.logEvent({ tenantId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: 'VENTE_ANNULEE', targetType: 'VENTE', targetId: id, reference: vente.reference, description: `Annulation vente ${vente.reference}`, metadata: { motif, venteId: id } });
      return venteUpdated;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateVenteDto) {
    const vente = await this.prisma.vente.findFirst({ where: { id, tenantId } });
    if (!vente) throw new NotFoundException(`Vente with ID ${id} not found`);
    return this.prisma.vente.update({ where: { id }, data: { ...dto } });
  }

  async getCaisse(tenantId: string, depotId: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ventes = await this.prisma.vente.aggregate({ where: { tenantId, depotId: selectedDepotId, date: { gte: today }, statut: StatutVente.PAYE }, _sum: { total: true }, _count: true });
    return { montantTotal: ventes._sum?.total ?? 0, nombreVentes: ventes._count, date: today };
  }
}
