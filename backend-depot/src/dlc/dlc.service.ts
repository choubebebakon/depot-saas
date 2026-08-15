import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum StatutDLC {
  OK = 'OK',
  ATTENTION = 'ATTENTION',
  URGENT = 'URGENT',
  EXPIRE = 'EXPIRE',
}

@Injectable()
export class DlcService {
  constructor(private prisma: PrismaService) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) throw new BadRequestException('depotId est obligatoire pour isoler les lots du depot actif.');
    return depotId;
  }

  private requirePositiveQuantity(quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) throw new BadRequestException('La quantité du lot doit être supérieure à 0.');
  }

  private normalizeDlc(dlc?: Date) {
    if (dlc === undefined) return undefined;
    if (Number.isNaN(dlc.getTime())) throw new BadRequestException('La date de péremption est invalide.');
    return dlc;
  }

  getStatutDLC(dlc: Date | null): StatutDLC {
    if (!dlc) return StatutDLC.OK;
    const diffJours = Math.floor((dlc.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffJours < 0) return StatutDLC.EXPIRE;
    if (diffJours < 7) return StatutDLC.URGENT;
    if (diffJours < 30) return StatutDLC.ATTENTION;
    return StatutDLC.OK;
  }

  async creerLot(data: { articleId: string; depotId: string; tenantId: string; quantite: number; dlc?: Date; numeroLot?: string }) {
    this.requirePositiveQuantity(data.quantite);
    const dlc = this.normalizeDlc(data.dlc);
    const article = await this.prisma.article.findFirst({ where: { id: data.articleId, tenantId: data.tenantId }, select: { id: true } });
    if (!article) throw new NotFoundException('Article introuvable pour ce tenant.');
    const depot = await this.prisma.depot.findFirst({ where: { id: data.depotId, tenantId: data.tenantId }, select: { id: true } });
    if (!depot) throw new NotFoundException('Dépôt introuvable pour ce tenant.');

    return this.prisma.lotStock.create({
      data: { articleId: data.articleId, depotId: data.depotId, tenantId: data.tenantId, quantite: data.quantite, quantiteInitiale: data.quantite, dlc: dlc ?? null, numeroLot: data.numeroLot?.trim() || null },
      include: { article: true, depot: true },
    });
  }

  async findLots(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const lots = await this.prisma.lotStock.findMany({ where: { tenantId, depotId: selectedDepotId, quantite: { gt: 0 } }, include: { article: { include: { famille: true, marque: true } }, depot: true }, orderBy: [{ dlc: 'asc' }, { createdAt: 'asc' }] });
    const now = Date.now();
    return lots.map(lot => ({ ...lot, statutDLC: this.getStatutDLC(lot.dlc), joursRestants: lot.dlc ? Math.floor((lot.dlc.getTime() - now) / (1000 * 60 * 60 * 24)) : null }));
  }

  async getAlertes(tenantId: string, depotId?: string) {
    const lots = await this.findLots(tenantId, depotId);
    return lots.filter(l => l.statutDLC !== StatutDLC.OK);
  }

  async getStats(tenantId: string, depotId?: string) {
    const lots = await this.findLots(tenantId, depotId);
    return { total: lots.length, ok: lots.filter(l => l.statutDLC === StatutDLC.OK).length, attention: lots.filter(l => l.statutDLC === StatutDLC.ATTENTION).length, urgent: lots.filter(l => l.statutDLC === StatutDLC.URGENT).length, expire: lots.filter(l => l.statutDLC === StatutDLC.EXPIRE).length };
  }

  async deduireLotFIFO(articleId: string, depotId: string, tenantId: string, quantiteADeduire: number) {
    this.requirePositiveQuantity(quantiteADeduire);
    const lots = await this.prisma.lotStock.findMany({ where: { articleId, depotId, tenantId, quantite: { gt: 0 } }, orderBy: [{ dlc: 'asc' }, { createdAt: 'asc' }] });
    let restantADeduire = quantiteADeduire;
    for (const lot of lots) {
      if (restantADeduire <= 0) break;
      const deduction = Math.min(lot.quantite, restantADeduire);
      await this.prisma.lotStock.update({ where: { id: lot.id }, data: { quantite: lot.quantite - deduction } });
      restantADeduire -= deduction;
    }
    if (restantADeduire > 0) throw new BadRequestException(`Stock par lots insuffisant : ${restantADeduire} unité(s) non couvertes.`);
  }

  async updateLot(id: string, tenantId: string, data: { dlc?: Date; numeroLot?: string }) {
    const lot = await this.prisma.lotStock.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!lot) throw new NotFoundException('Lot introuvable pour ce tenant.');
    const updateData: { dlc?: Date; numeroLot?: string | null } = {};
    if (data.dlc !== undefined) updateData.dlc = this.normalizeDlc(data.dlc);
    if (data.numeroLot !== undefined) updateData.numeroLot = data.numeroLot.trim() || null;
    return this.prisma.lotStock.update({ where: { id: lot.id }, data: updateData, include: { article: true, depot: true } });
  }
}
