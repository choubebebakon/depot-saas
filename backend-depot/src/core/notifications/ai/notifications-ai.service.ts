import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { NotificationsService } from '../notifications.service';
import { NotifType } from '@prisma/client';

@Injectable()
export class NotificationsAiService {
  private readonly logger = new Logger(NotificationsAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifs: NotificationsService,
  ) {}

  async analyseVentes(tenantId: string): Promise<void> {
    try {
      const now = new Date();
      const period7j = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const period14j = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [ventes7j, ventes14j, articlesPopulaires] = await Promise.all([
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: period7j }, statut: 'PAYE' as any },
          _sum: { total: true },
          _count: true,
        }),
        this.prisma.vente.aggregate({
          where: {
            tenantId,
            date: { gte: period14j, lt: period7j },
            statut: 'PAYE' as any,
          },
          _sum: { total: true },
          _count: true,
        }),
        this.prisma.ligneVente.groupBy({
          by: ['articleId'],
          where: {
            vente: { tenantId, date: { gte: period7j }, statut: 'PAYE' as any },
          },
          _sum: { quantite: true },
          orderBy: { _sum: { quantite: 'desc' } },
          take: 5,
        }),
      ]);

      const ca7j = ventes7j._sum?.total || 0;
      const ca14j = ventes14j._sum?.total || 0;

      if (ca14j > 0) {
        const variation = ((ca7j - ca14j) / ca14j) * 100;
        if (variation < -20) {
          await this.notifs.createFromTemplate(
            tenantId,
            NotifType.ALERTE_PREDICTIVE,
            {
              message: `Baisse d'activité de ${Math.abs(variation).toFixed(0)}% sur les 7 derniers jours`,
              score: Math.abs(variation),
            },
          );
        }
        if (variation > 30) {
          const topArticle = articlesPopulaires[0];
          if (topArticle) {
            const article = await this.prisma.article.findUnique({
              where: { id: topArticle.articleId },
              select: { designation: true },
            });
            await this.notifs.createFromTemplate(
              tenantId,
              NotifType.ALERTE_PREDICTIVE,
              {
                message: `Forte hausse des ventes (${variation.toFixed(0)}%) — "${article?.designation || 'Article'}" en tête`,
                score: variation,
              },
            );
          }
        }
      }
    } catch (e) {
      this.logger.error(
        `Erreur analyse ventes tenant ${tenantId}: ${(e as Error).message}`,
      );
    }
  }

  async predictRuptures(tenantId: string): Promise<void> {
    try {
      const stocks: any[] = await this.prisma.stock.findMany({
        where: { depot: { tenantId }, quantite: { gt: 0 } },
        include: { article: { select: { designation: true } } },
      });

      for (const stock of stocks) {
        const period30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const ventes = await this.prisma.ligneVente.aggregate({
          where: {
            articleId: stock.articleId,
            vente: {
              tenantId,
              date: { gte: period30j },
              statut: 'PAYE' as any,
            },
          },
          _sum: { quantite: true },
        });

        const quantiteVendue = ventes._sum?.quantite || 0;
        if (quantiteVendue <= 0) continue;

        const joursMoyen = 30;
        const joursRestants = (stock.quantite / quantiteVendue) * joursMoyen;

        if (joursRestants < 5 && stock.quantite > 0) {
          await this.notifs.createFromTemplate(
            tenantId,
            NotifType.ALERTE_PREDICTIVE,
            {
              message: `Rupture prévue dans ${Math.ceil(joursRestants)}j pour "${stock.article?.designation || 'Article'}" (stock: ${stock.quantite}, vélocité: ${(quantiteVendue / joursMoyen).toFixed(1)}/j)`,
              score: Math.max(0, 100 - joursRestants * 20),
            },
          );
        }
      }
    } catch (e) {
      this.logger.error(
        `Erreur prédiction ruptures tenant ${tenantId}: ${(e as Error).message}`,
      );
    }
  }

  async generateDailyDigest(tenantId: string): Promise<void> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        ventesJour,
        nouveauClients,
        nouvellesNotifications,
        totalVentes,
        nouveauxArticles,
      ] = await Promise.all([
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: yesterday }, statut: 'PAYE' as any },
          _sum: { total: true },
          _count: true,
        }),
        this.prisma.client.count({
          where: { tenantId, createdAt: { gte: yesterday } },
        }),
        this.prisma.notification.count({
          where: {
            tenantId,
            createdAt: { gte: yesterday },
            priority: { in: ['HIGH', 'CRITICAL'] as any },
          },
        }),
        this.prisma.vente.aggregate({
          where: { tenantId, statut: 'PAYE' as any },
          _sum: { total: true },
        }),
        this.prisma.article.count({
          where: { tenantId, createdAt: { gte: yesterday } },
        }),
      ]);

      const ca = ventesJour._sum?.total || 0;
      const nbVentes = ventesJour._count || 0;
      const caTotal = totalVentes._sum?.total || 0;

      await this.notifs.createFromTemplate(
        tenantId,
        NotifType.RAPPORT_JOURNALIER,
        {
          ventesJour: nbVentes,
          caJour: ca,
          nouveauClients,
          alertes: nouvellesNotifications,
          nouveauxArticles,
          caTotal,
          date: new Date().toISOString().split('T')[0],
        },
      );

      this.logger.log(
        `Digest généré pour tenant ${tenantId}: ${nbVentes} ventes, ${ca}F CFA`,
      );
    } catch (e) {
      this.logger.error(
        `Erreur digest tenant ${tenantId}: ${(e as Error).message}`,
      );
    }
  }
}
