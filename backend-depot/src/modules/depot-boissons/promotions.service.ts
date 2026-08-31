import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DepotBoissonsPromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private requireDepotId(depotId?: string) {
    if (!depotId || ['undefined', 'null', 'all'].includes(depotId)) {
      throw new BadRequestException('Dépôt actif requis pour les promotions.');
    }
    return depotId;
  }

  private async assertArticleInDepot(
    tenantId: string,
    depotId: string,
    articleId: string,
  ) {
    const article = await this.prisma.article.findFirst({
      where: {
        id: articleId,
        tenantId,
        stocks: { some: { depotId } },
      },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('Article introuvable dans le dépôt actif.');
    }
  }

  async findAll(tenantId: string, depotId?: string) {
    const activeDepotId = this.requireDepotId(depotId);
    const promotions = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        article: { stocks: { some: { depotId: activeDepotId } } },
      },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
    return promotions;
  }

  async create(tenantId: string, depotId: string | undefined, data: any) {
    const activeDepotId = this.requireDepotId(depotId);
    if (!data?.articleId) throw new BadRequestException('articleId requis.');

    await this.assertArticleInDepot(tenantId, activeDepotId, data.articleId);

    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);
    const valeur = Number(data.valeur);
    const prixPromo = Number(data.prixPromo);

    if (!Number.isFinite(dateDebut.getTime()) || !Number.isFinite(dateFin.getTime())) {
      throw new BadRequestException('Dates de promotion invalides.');
    }
    if (dateFin <= dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    }
    if (!Number.isFinite(valeur) || valeur < 0 || !Number.isFinite(prixPromo) || prixPromo < 0) {
      throw new BadRequestException('Valeur ou prix promotionnel invalide.');
    }

    return this.prisma.promotion.create({
      data: {
        nom: String(data.nom || '').trim(),
        type: data.type,
        valeur,
        prixPromo,
        dateDebut,
        dateFin,
        actif: data.actif ?? true,
        articleId: data.articleId,
        tenantId,
      },
      include: { article: true },
    });
  }

  async update(tenantId: string, depotId: string | undefined, id: string, data: any) {
    const activeDepotId = this.requireDepotId(depotId);
    const existing = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      select: { id: true, articleId: true },
    });
    if (!existing) throw new NotFoundException('Promotion introuvable.');

    const articleId = data.articleId || existing.articleId;
    await this.assertArticleInDepot(tenantId, activeDepotId, articleId);

    const updateData: any = {};
    for (const field of ['nom', 'type', 'actif', 'articleId']) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    if (data.valeur !== undefined) updateData.valeur = Number(data.valeur);
    if (data.prixPromo !== undefined) updateData.prixPromo = Number(data.prixPromo);
    if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) updateData.dateFin = new Date(data.dateFin);

    if (updateData.dateDebut && updateData.dateFin && updateData.dateFin <= updateData.dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    }

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
      include: { article: true },
    });
  }

  async remove(tenantId: string, depotId: string | undefined, id: string) {
    const activeDepotId = this.requireDepotId(depotId);
    const existing = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      select: { id: true, articleId: true },
    });
    if (!existing) throw new NotFoundException('Promotion introuvable.');
    await this.assertArticleInDepot(tenantId, activeDepotId, existing.articleId);
    return this.prisma.promotion.delete({ where: { id } });
  }
}
