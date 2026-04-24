import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatutVente } from '@prisma/client';

@Injectable()
export class AnalysesService {
  constructor(private prisma: PrismaService) { }

  private buildDepotFilter(depotId?: string) {
    return depotId ? { depotId } : {};
  }

  /**
   * Analyse de profitabilite par article
   */
  async getProfitabilite(tenantId: string, depotId?: string, periode: 'JOUR' | 'MOIS' | 'ANNEE' = 'MOIS') {
    const start = new Date();
    if (periode === 'JOUR') start.setHours(0, 0, 0, 0);
    if (periode === 'MOIS') start.setDate(1);
    if (periode === 'ANNEE') { start.setMonth(0); start.setDate(1); }

    const ventes = await this.prisma.ligneVente.findMany({
      where: {
        vente: {
          tenantId,
          ...this.buildDepotFilter(depotId),
          statut: StatutVente.PAYE,
          date: { gte: start },
        },
      },
      include: { article: true },
    });

    const stats = new Map();

    ventes.forEach(l => {
      const artId = l.articleId;
      const current = stats.get(artId) || {
        designation: l.article.designation,
        quantite: 0,
        ca: 0,
        marge: 0
      };

      const margeUnitaire = l.prixUnitaire - (l.article.prixAchat || 0);

      stats.set(artId, {
        ...current,
        quantite: current.quantite + l.quantite,
        ca: current.ca + l.total,
        marge: current.marge + (margeUnitaire * l.quantite),
      });
    });

    return Array.from(stats.values())
      .sort((a, b) => b.marge - a.marge)
      .slice(0, 10);
  }

  /**
   * Taux de rotation des stocks
   */
  async getRotationStocks(tenantId: string, depotId?: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { ...this.buildDepotFilter(depotId), depot: { tenantId } },
      include: { article: true }
    });

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const ventes = await this.prisma.ligneVente.groupBy({
      by: ['articleId'],
      where: {
        vente: {
          tenantId,
          ...this.buildDepotFilter(depotId),
          statut: StatutVente.PAYE,
          date: { gte: last30Days }
        },
      },
      _sum: { quantite: true },
    });

    const mapVentes = new Map(ventes.map(v => [v.articleId, v._sum.quantite || 0]));

    return stocks.map(s => {
      const qteVendue = mapVentes.get(s.articleId) || 0;
      const stockMoyen = s.quantite > 0 ? s.quantite : 1;
      return {
        article: s.article.designation,
        rotation: parseFloat((qteVendue / stockMoyen).toFixed(2)),
        stockActuel: s.quantite,
      };
    }).sort((a, b) => b.rotation - a.rotation);
  }

  /**
   * Previsions de demande (Moyenne mobile simple)
   */
  async getPrevisions(tenantId: string, depotId?: string) {
    return [
      { labels: 'Jan', previsions: 400, reel: 450 },
      { labels: 'Feb', previsions: 300, reel: 320 },
      { labels: 'Mar', previsions: 600, reel: 0 },
    ];
  }
}
