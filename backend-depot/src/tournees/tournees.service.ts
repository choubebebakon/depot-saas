import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  OuvrirTourneeDto,
  ChargerTourneeDto,
  ClotureCommercialeDto,
  ValidationMagasinierDto,
  CreateTricycleDto,
} from './dto/tournee.dto';

@Injectable()
export class TourneesService {
  constructor(private prisma: PrismaService) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) throw new BadRequestException('depotId est obligatoire pour isoler les tournees du depot actif.');
    return depotId;
  }

  // ── Tricycles ────────────────────────────────────────────
  async createTricycle(dto: CreateTricycleDto) {
    const depotId = this.requireDepotId(dto.depotId);
    const existing = await this.prisma.tricycle.findFirst({ where: { tenantId: dto.tenantId, depotId, nom: dto.nom.trim() }, select: { id: true } });
    if (existing) throw new ConflictException('Un tricycle avec cette immatriculation existe déjà dans ce dépôt.');
    return this.prisma.tricycle.create({ data: { nom: dto.nom.trim(), tenantId: dto.tenantId, depotId, estLibre: true } });
  }

  async findTricycles(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    return this.prisma.tricycle.findMany({
      where: { tenantId, depotId: selectedDepotId },
      include: {
        tournees: {
          where: { statut: { in: ['OUVERTE', 'CLOTURE_COMMERCIALE'] } },
          take: 1,
          include: { commercial: { select: { email: true, nom: true } } },
        },
      },
      orderBy: { nom: 'asc' },
    });
  }

  // ── Ouverture Tournée ────────────────────────────────────
  async ouvrirTournee(dto: OuvrirTourneeDto) {
    const depotId = this.requireDepotId(dto.depotId);
    return this.prisma.$transaction(async (tx) => {
      const tricycle = await tx.tricycle.findFirst({ where: { id: dto.tricycleId, tenantId: dto.tenantId, depotId }, select: { id: true, estLibre: true } });
      if (!tricycle) throw new BadRequestException('Tricycle introuvable dans ce dépôt');
      if (!tricycle.estLibre) throw new ConflictException("Ce tricycle est déjà en tournée. Clôturez la tournée précédente d'abord.");

      const commercial = await tx.user.findFirst({ where: { id: dto.commercialId, tenantId: dto.tenantId, depotId }, select: { id: true } });
      if (!commercial) throw new BadRequestException('Commercial introuvable dans ce dépôt');

      const locked = await tx.tricycle.updateMany({ where: { id: dto.tricycleId, tenantId: dto.tenantId, depotId, estLibre: true }, data: { estLibre: false } });
      if (!locked.count) throw new ConflictException('Le tricycle vient d’être affecté à une autre tournée.');

      const count = await tx.tournee.count({ where: { tenantId: dto.tenantId, depotId } });
      const annee = new Date().getFullYear();
      const reference = `TRN-${annee}-${String(count + 1).padStart(5, '0')}`;

      return tx.tournee.create({
        data: { reference, statut: 'OUVERTE', depotId, tricycleId: dto.tricycleId, commercialId: dto.commercialId, tenantId: dto.tenantId },
        include: { tricycle: true, commercial: { select: { email: true, role: true, nom: true } }, depot: true },
      });
    }, { isolationLevel: 'Serializable' });
  }

  // ── Chargement ───────────────────────────────────────────
  async chargerTournee(dto: ChargerTourneeDto) {
    const tournee = await this.prisma.tournee.findFirst({ where: { id: dto.tourneeId, tenantId: dto.tenantId }, include: { lignesChargement: true } });
    if (!tournee) throw new BadRequestException('Tournée introuvable');
    if (tournee.statut !== 'OUVERTE') throw new BadRequestException('Impossible de charger : tournée non ouverte');

    return this.prisma.$transaction(async (tx) => {
      for (const ligne of dto.lignes) {
        const stock = await tx.stock.findUnique({ where: { articleId_depotId: { articleId: ligne.articleId, depotId: tournee.depotId } } });
        if (!stock || stock.quantite < ligne.quantiteChargee) {
          const article = await tx.article.findUnique({ where: { id: ligne.articleId } });
          throw new BadRequestException(`Stock insuffisant pour ${article?.designation || ligne.articleId}. Disponible: ${stock?.quantite || 0}`);
        }
        await tx.stock.update({ where: { id: stock.id }, data: { quantite: { decrement: ligne.quantiteChargee } } });
        const existante = await tx.ligneChargement.findFirst({ where: { tourneeId: dto.tourneeId, articleId: ligne.articleId } });
        if (existante) {
          await tx.ligneChargement.update({ where: { id: existante.id }, data: { quantiteChargee: { increment: ligne.quantiteChargee } } });
        } else {
          await tx.ligneChargement.create({ data: { tourneeId: dto.tourneeId, articleId: ligne.articleId, quantiteChargee: ligne.quantiteChargee } });
        }
        await tx.mouvementStock.create({ data: { type: 'TRANSFERT_SORTIE', quantite: ligne.quantiteChargee, motif: `Chargement tournée ${tournee.reference}`, articleId: ligne.articleId, depotId: tournee.depotId, tenantId: dto.tenantId, tourneeId: dto.tourneeId } });
      }
      return tx.tournee.findUnique({ where: { id: dto.tourneeId }, include: { lignesChargement: { include: { article: true } }, commercial: { select: { email: true, nom: true } }, depot: true, tricycle: true } });
    }, { isolationLevel: 'Serializable' });
  }

  // ── Clôture Commerciale ──────────────────────────────────
  async clotureCommerciale(dto: ClotureCommercialeDto) {
    const tournee = await this.prisma.tournee.findFirst({ where: { id: dto.tourneeId, tenantId: dto.tenantId } });
    if (!tournee) throw new BadRequestException('Tournée introuvable');
    if (tournee.statut !== 'OUVERTE') throw new BadRequestException('La tournée doit être ouverte pour faire la clôture commerciale');
    return this.prisma.tournee.update({ where: { id: dto.tourneeId }, data: { statut: 'CLOTURE_COMMERCIALE', cashRemis: dto.cashRemis, omRemis: dto.omRemis, momoRemis: dto.momoRemis, noteCloture: dto.noteCloture } });
  }

  // ── Validation Magasinier ────────────────────────────────
  async validerMagasinier(dto: ValidationMagasinierDto) {
    const tournee = await this.prisma.tournee.findFirst({ where: { id: dto.tourneeId, tenantId: dto.tenantId }, include: { lignesChargement: { include: { article: true } } } });
    if (!tournee) throw new BadRequestException('Tournée introuvable');
    if (tournee.statut !== 'CLOTURE_COMMERCIALE') throw new BadRequestException('La tournée doit être en clôture commerciale');

    return this.prisma.$transaction(async (tx) => {
      let ecartTotal = 0;
      for (const retour of dto.lignesRetour) {
        const ligne = tournee.lignesChargement.find((l) => l.articleId === retour.articleId);
        if (!ligne) continue;
        const attenduRetour = ligne.quantiteChargee - ligne.quantiteVendue;
        const ecartLigne = retour.quantiteRetour - attenduRetour;
        ecartTotal += Math.abs(ecartLigne);
        await tx.ligneChargement.update({ where: { id: ligne.id }, data: { quantiteRetour: retour.quantiteRetour } });
        if (retour.quantiteRetour > 0) {
          const stockDepot = await tx.stock.findUnique({ where: { articleId_depotId: { articleId: retour.articleId, depotId: tournee.depotId } } });
          if (stockDepot) await tx.stock.update({ where: { id: stockDepot.id }, data: { quantite: { increment: retour.quantiteRetour } } });
          else await tx.stock.create({ data: { articleId: retour.articleId, depotId: tournee.depotId, quantite: retour.quantiteRetour } });
          await tx.mouvementStock.create({ data: { type: 'TRANSFERT_ENTREE', quantite: retour.quantiteRetour, motif: `Retour tournée ${tournee.reference}`, articleId: retour.articleId, depotId: tournee.depotId, tenantId: dto.tenantId, tourneeId: dto.tourneeId } });
        }
      }
      await tx.tricycle.update({ where: { id: tournee.tricycleId }, data: { estLibre: true } });
      return tx.tournee.update({ where: { id: dto.tourneeId }, data: { statut: 'VALIDEE', dateCloture: new Date(), ecartStock: ecartTotal, noteValidation: dto.noteValidation }, include: { lignesChargement: { include: { article: true } }, commercial: { select: { email: true, nom: true } }, tricycle: true, depot: true } });
    }, { isolationLevel: 'Serializable' });
  }

  // ── Lister tournées ──────────────────────────────────────
  async findAll(tenantId: string, depotId?: string, statut?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    return this.prisma.tournee.findMany({
      where: { tenantId, depotId: selectedDepotId, ...(statut ? { statut: statut as any } : {}) },
      include: { commercial: { select: { email: true, role: true, nom: true } }, tricycle: true, depot: true, lignesChargement: { include: { article: true } }, _count: { select: { ventes: true } } },
      orderBy: { dateOuverture: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    return this.prisma.tournee.findFirst({
      where: { id, tenantId, depotId: selectedDepotId },
      include: { commercial: { select: { email: true, nom: true } }, tricycle: true, depot: true, lignesChargement: { include: { article: true } }, ventes: { include: { lignes: { include: { article: true } } }, orderBy: { date: 'desc' } } },
    });
  }

  async statsTournees(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const where = { tenantId, depotId: selectedDepotId };
    const [actives, attenteMagasinier, total] = await Promise.all([
      this.prisma.tournee.count({ where: { ...where, statut: { in: ['OUVERTE', 'CLOTURE_COMMERCIALE'] } } }),
      this.prisma.tournee.count({ where: { ...where, statut: 'CLOTURE_COMMERCIALE' } }),
      this.prisma.tournee.count({ where }),
    ]);
    return { actives, attenteMagasinier, total };
  }
}
