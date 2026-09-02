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
import { randomUUID } from 'node:crypto';
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

    const selectedDepotId = this.requireDepotId(depotId);
    if (!tenantId) throw new BadRequestException('tenantId est obligatoire.');

    return await this.prisma.$transaction(async (tx) => {
      if (!Array.isArray(lignes) || lignes.length === 0) {
        throw new BadRequestException('Une vente doit contenir au moins une ligne.');
      }

      if (id) {
        const existing = await tx.vente.findFirst({
          where: { id, tenantId, depotId: selectedDepotId },
          include: { lignes: { include: { article: true } }, client: true },
        });
        if (existing) return existing;
      }

      let totalVente = 0;
      const lignesData: any[] = [];
      const stockDeductions: { articleId: string; quantite: number }[] = [];

      for (const ligne of lignes) {
        const quantite = Number(ligne.quantite);
        if (!Number.isInteger(quantite) || quantite <= 0) {
          throw new BadRequestException('La quantité de chaque ligne doit être un entier supérieur à 0.');
        }
        const remise = Number(ligne.remise || 0);
        if (!Number.isFinite(remise) || remise < 0) {
          throw new BadRequestException('La remise doit être un montant positif ou nul.');
        }

        const article = await tx.article.findFirst({ where: { id: ligne.articleId, tenantId } });
        if (!article) throw new BadRequestException('Article introuvable.');

        let prixBase = Number(article.prixVente);
        let deductions: { articleId: string; quantite: number }[] = [
          { articleId: article.id, quantite },
        ];

        if (ligne.conditionnementId) {
          const conditionnement = await tx.conditionnement.findFirst({
            where: { id: ligne.conditionnementId, tenantId, articleId: article.id },
          });
          if (!conditionnement) throw new BadRequestException('Conditionnement introuvable pour cet article.');
          if (!Number.isInteger(conditionnement.quantiteUnitaire) || conditionnement.quantiteUnitaire <= 0) {
            throw new BadRequestException('Conditionnement invalide.');
          }
          prixBase = ligne.prix == null ? Number(conditionnement.prixVente) : Number(ligne.prix);
          deductions = [{ articleId: article.id, quantite: quantite * conditionnement.quantiteUnitaire }];
        } else if (ligne.casierMixte) {
          const composition = Array.isArray(ligne.composition) ? ligne.composition : null;
          if (!composition || composition.length === 0) {
            throw new BadRequestException('La composition du casier mixte est obligatoire.');
          }
          prixBase = ligne.prix == null ? Number(article.prixVente) : Number(ligne.prix);
          deductions = composition.map((item: any) => {
            const itemQty = Number(item?.quantite);
            if (!item?.articleId || !Number.isInteger(itemQty) || itemQty <= 0) {
              throw new BadRequestException('Composition de casier mixte invalide.');
            }
            return { articleId: String(item.articleId), quantite: itemQty * quantite };
          });
          for (const deduction of deductions) {
            const component = await tx.article.findFirst({ where: { id: deduction.articleId, tenantId } });
            if (!component) throw new BadRequestException('Article de composition introuvable.');
          }
        } else if (ligne.prix != null) {
          throw new BadRequestException('Le prix manuel est réservé aux conditionnements ou casiers mixtes.');
        }

        if (!Number.isFinite(prixBase) || prixBase < 0) {
          throw new BadRequestException(`Prix invalide pour l'article ${article.designation}.`);
        }
        const totalLigne = Number((prixBase * quantite - remise).toFixed(2));
        if (totalLigne < 0) {
          throw new BadRequestException("Le total d'une ligne ne peut pas être négatif.");
        }
        totalVente += totalLigne;
        stockDeductions.push(...deductions);
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
        throw new BadRequestException(`Paiement incohérent : ${totalPaiement} FCFA pour une vente de ${montantTotal} FCFA.`);
      }
      if (mode === ModePaiement.CREDIT && !clientId) {
        throw new BadRequestException('Un client est obligatoire pour une vente à crédit.');
      }
      if (mode === ModePaiement.CASH && cash <= 0) {
        throw new BadRequestException('Le montant CASH est obligatoire pour une vente comptant.');
      }

      let client: any = null;
      if (clientId) {
        client = await tx.client.findFirst({ where: { id: clientId, tenantId, OR: [{ depotId: selectedDepotId }, { depotId: null }] } });
        if (!client) throw new BadRequestException('Client introuvable pour ce dépôt.');
      }
      if (tourneeId) {
        const tournee = await tx.tournee.findFirst({ where: { id: tourneeId, tenantId, depotId: selectedDepotId } });
        if (!tournee) throw new BadRequestException('Tournée introuvable pour ce dépôt.');
      }

      let sessionCaisse: { id: string } | null = null;
      if (cash > 0) {
        sessionCaisse = await tx.sessionCaisse.findFirst({
          where: { tenantId, depotId: selectedDepotId, estOuverte: true },
          select: { id: true },
        });
        if (!sessionCaisse) throw new BadRequestException("Impossible d'encaisser en espèces : aucune session de caisse ouverte pour ce dépôt.");
      }

      let reference = clientRef;
      if (!reference) reference = `FAC-${new Date().getFullYear()}-${randomUUID()}`;

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
          depotId: selectedDepotId,
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

      for (const deduction of stockDeductions) {
        const updated = await tx.stock.updateMany({
          where: { articleId: deduction.articleId, depotId: selectedDepotId, quantite: { gte: deduction.quantite } },
          data: { quantite: { decrement: deduction.quantite } },
        });
        if (updated.count !== 1) throw new BadRequestException(`Stock insuffisant pour l'article ${deduction.articleId}. La vente n'a pas été enregistrée.`);
        await tx.mouvementStock.create({
          data: {
            type: TypeMouvement.SORTIE_VENTE,
            quantite: deduction.quantite,
            articleId: deduction.articleId,
            depotId: selectedDepotId,
            tenantId,
            motif: `Vente POS ${reference}`,
          },
        });
      }

      if (credit > 0 && clientId) {
        const existingDebt = await tx.detteClient.findFirst({ where: { tenantId, depotId: selectedDepotId, clientId, reference: vente.reference } });
        if (!existingDebt) {
          await tx.detteClient.create({
            data: {
              montant: credit,
              montantPaye: 0,
              statut: 'EN_COURS',
              reference: vente.reference,
              clientId,
              tenantId,
              depotId: selectedDepotId,
            },
          });
          await tx.client.update({ where: { id: clientId }, data: { soldeCredit: { increment: credit } } });
        }
      }

      if (retoursConsigne && Array.isArray(retoursConsigne) && clientId) {
        for (const retour of retoursConsigne) {
          const portefeuille = await tx.portefeuilleConsigne.findUnique({
            where: { clientId_typeConsigneId: { clientId, typeConsigneId: retour.typeConsigneId } },
          });
          const retourQty = Number(retour.quantite);
          if (!portefeuille || !Number.isInteger(retourQty) || retourQty <= 0 || portefeuille.quantite < retourQty) {
            throw new BadRequestException('Quantité de consignes retournées supérieure au portefeuille client.');
          }
          const typeConsigne = await tx.typeConsigneConfig.findFirst({ where: { id: retour.typeConsigneId, tenantId } });
          if (!typeConsigne) throw new BadRequestException('Type de consigne introuvable.');
          await tx.mouvementConsigne.create({
            data: {
              quantite: retourQty,
              motif: `Retour vide sur vente ${reference}`,
              estSortie: false,
              tenantId,
              depotId: selectedDepotId,
              venteId: vente.id,
              typeConsigne: { connect: { id: retour.typeConsigneId } },
            },
          });
          await tx.portefeuilleConsigne.update({
            where: { clientId_typeConsigneId: { clientId, typeConsigneId: retour.typeConsigneId } },
            data: { quantite: { decrement: retourQty } },
          });
        }
      }

      const remiseTotale = lignes.reduce((acc: number, l: any) => acc + Number(l.remise || 0), 0);
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
        const composition = ligne.composition ? typeof ligne.composition === 'string' ? JSON.parse(ligne.composition) : ligne.composition : null;
        if (ligne.casierMixte && composition && Array.isArray(composition)) stockDecs = composition.map((item: any) => ({ articleId: item.articleId, quantite: item.quantite * ligne.quantite }));
        else if (ligne.conditionnementId) {
          const cond = await tx.conditionnement.findFirst({ where: { id: ligne.conditionnementId, tenantId, articleId: ligne.articleId } });
          if (!cond) throw new BadRequestException('Conditionnement introuvable.');
          stockDecs = [{ articleId: ligne.articleId, quantite: ligne.quantite * cond.quantiteUnitaire }];
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
        throw new BadRequestException('Une vente déjà payée ne peut pas être annulée par cette opération. Utilisez le workflow de remboursement pour inverser les paiements.');
      }
      const venteUpdated = await tx.vente.update({ where: { id }, data: { statut: StatutVente.ANNULE, motifAnnulation: motif } });
      await this.auditService.logEvent({ tenantId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: 'VENTE_ANNULEE', targetType: 'VENTE', targetId: id, reference: vente.reference, description: `Annulation vente ${vente.reference}`, metadata: { motif, venteId: id } });
      return venteUpdated;
    });
  }

  async update(tenantId: string, depotId: string, id: string, dto: UpdateVenteDto) {
    const selectedDepotId = this.requireDepotId(depotId);
    const vente = await this.prisma.vente.findFirst({ where: { id, tenantId, depotId: selectedDepotId } });
    if (!vente) throw new NotFoundException(`Vente with ID ${id} not found`);
    if (dto.statut !== undefined || dto.modePaiement !== undefined) {
      throw new BadRequestException('Le statut et le mode de paiement d’une vente ne peuvent pas être modifiés via PUT. Utilisez les workflows dédiés.');
    }
    if (dto.motifAnnulation !== undefined && vente.statut !== StatutVente.ANNULE) {
      throw new BadRequestException('Le motif d’annulation ne peut être modifié que pour une vente déjà annulée.');
    }
    return this.prisma.vente.update({ where: { id }, data: { motifAnnulation: dto.motifAnnulation } });
  }

  async getCaisse(tenantId: string, depotId: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ventes = await this.prisma.vente.aggregate({ where: { tenantId, depotId: selectedDepotId, date: { gte: today }, statut: StatutVente.PAYE }, _sum: { total: true }, _count: true });
    return { montantTotal: ventes._sum?.total ?? 0, nombreVentes: ventes._count, date: today };
  }
}
