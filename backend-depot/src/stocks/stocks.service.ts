import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TypeMouvement } from '@prisma/client';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) { }

  // 1. Ajustement (Entrée/Sortie directe)
  async ajusterStock(data: {
    articleId: string;
    siteId: string;
    quantite: number;
    tenantId: string;
    motif?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const stockMisAJour = await tx.stock.upsert({
        where: { articleId_siteId: { articleId: data.articleId, siteId: data.siteId } },
        update: { quantite: { increment: data.quantite } },
        create: {
          articleId: data.articleId,
          siteId: data.siteId,
          quantite: data.quantite,
        },
      });

      await tx.mouvementStock.create({
        data: {
          type: data.quantite > 0 ? TypeMouvement.ENTREE : TypeMouvement.SORTIE,
          quantite: Math.abs(data.quantite),
          motif: data.motif || "Ajustement manuel",
          articleId: data.articleId,
          siteId: data.siteId,
          tenantId: data.tenantId,
        },
      });

      return stockMisAJour;
    });
  }

  // 2. Transfert entre deux dépôts
  async transfererStock(data: {
    articleId: string;
    sourceSiteId: string;
    destinationSiteId: string;
    quantite: number;
    tenantId: string;
    motif?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Retirer du site source
      await tx.stock.update({
        where: { articleId_siteId: { articleId: data.articleId, siteId: data.sourceSiteId } },
        data: { quantite: { decrement: data.quantite } },
      });

      // Ajouter au site destination
      await tx.stock.upsert({
        where: { articleId_siteId: { articleId: data.articleId, siteId: data.destinationSiteId } },
        update: { quantite: { increment: data.quantite } },
        create: { articleId: data.articleId, siteId: data.destinationSiteId, quantite: data.quantite },
      });

      // Double historique pour la traçabilité
      await tx.mouvementStock.createMany({
        data: [
          {
            type: 'TRANSFERT_SORTIE',
            quantite: data.quantite,
            motif: data.motif || `Transfert vers ${data.destinationSiteId}`,
            articleId: data.articleId,
            siteId: data.sourceSiteId,
            tenantId: data.tenantId,
          },
          {
            type: 'TRANSFERT_ENTREE',
            quantite: data.quantite,
            motif: data.motif || `Réception depuis ${data.sourceSiteId}`,
            articleId: data.articleId,
            siteId: data.destinationSiteId,
            tenantId: data.tenantId,
          },
        ],
      });

      return { message: "Transfert réussi" };
    });
  }

  // 3. Voir l'historique
  async obtenirMouvements(tenantId: string) {
    return this.prisma.mouvementStock.findMany({
      where: { tenantId },
      include: { article: true, site: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}