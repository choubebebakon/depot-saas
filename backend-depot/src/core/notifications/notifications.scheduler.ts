import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsAiService } from './ai/notifications-ai.service';
import { MetierType, NotifType, NotifPriority } from '@prisma/client';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifs: NotificationsService,
    private readonly ai: NotificationsAiService,
  ) {}

  @Cron('0 * * * *', {
    name: 'check-stock-critique',
    timeZone: 'Africa/Douala',
  })
  async checkStockCritique(): Promise<void> {
    this.logger.log('Vérification des stocks critiques...');
    const tenants = await this.prisma.tenant.findMany({
      where: { estActif: true },
      select: { id: true, metier: true },
    });

    for (const tenant of tenants) {
      try {
        const stockRows: any[] = await this.prisma.stock.findMany({
          where: { depot: { tenantId: tenant.id } },
          include: {
            article: { select: { designation: true, seuilCritique: true } },
          },
        });

        for (const stock of stockRows) {
          const seuil =
            (stock.seuilCritique ?? stock.article?.seuilCritique) || 5;

          if (stock.quantite > 0 && stock.quantite <= seuil) {
            await this.notifs.createFromTemplate(
              tenant.id,
              NotifType.STOCK_CRITIQUE,
              {
                articleNom: stock.article?.designation || 'Inconnu',
                quantite: stock.quantite,
                seuil,
                articleId: stock.articleId,
              },
            );
          }

          if (stock.quantite <= 0) {
            await this.notifs.createFromTemplate(
              tenant.id,
              NotifType.STOCK_RUPTURE,
              {
                articleNom: stock.article?.designation || 'Inconnu',
                articleId: stock.articleId,
              },
            );
          }
        }

        if (tenant.metier === MetierType.PHARMACIE) {
          await this.checkMedicamentExpirations(tenant.id);
        }
      } catch (e) {
        this.logger.error(
          `Erreur stock critique tenant ${tenant.id}: ${(e as Error).message}`,
        );
      }
    }
  }

  @Cron('30 * * * *', {
    name: 'ai-predictions',
    timeZone: 'Africa/Douala',
  })
  async runAiPredictions(): Promise<void> {
    this.logger.log('Exécution des analyses IA prédictives...');
    const tenants = await this.prisma.tenant.findMany({
      where: { estActif: true },
      select: { id: true },
    });
    for (const tenant of tenants) {
      await this.ai.analyseVentes(tenant.id);
      await this.ai.predictRuptures(tenant.id);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'ai-daily-digest',
    timeZone: 'Africa/Douala',
  })
  async runAiDailyDigest(): Promise<void> {
    this.logger.log('Génération des résumés journaliers IA...');
    const tenants = await this.prisma.tenant.findMany({
      where: { estActif: true },
      select: { id: true },
    });
    for (const tenant of tenants) {
      await this.ai.generateDailyDigest(tenant.id);
    }
  }

  private async checkMedicamentExpirations(tenantId: string): Promise<void> {
    const lots = await this.prisma.lotStock.findMany({
      where: {
        tenantId,
        dlc: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      include: { article: { select: { designation: true } } },
    });

    for (const lot of lots) {
      if (!lot.dlc) continue;
      const joursRestants = Math.ceil(
        (lot.dlc.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
      );
      await this.notifs.createFromTemplate(
        tenantId,
        NotifType.STOCK_EXPIRATION,
        {
          articleNom: lot.article.designation,
          dateExpiration: lot.dlc.toISOString().split('T')[0],
          lotId: lot.id,
          joursRestants,
        },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: 'send-daily-digest',
    timeZone: 'Africa/Douala',
  })
  async sendDailyDigest(): Promise<void> {
    this.logger.log('Envoi des résumés journaliers...');
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { dailyDigest: true, digestHour: new Date().getHours() },
      include: { tenant: true },
    });

    for (const pref of prefs) {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [ventesJour, nouveauClients, alertes] = await Promise.all([
          this.prisma.vente.count({
            where: { tenantId: pref.tenantId, date: { gte: yesterday } },
          }),
          this.prisma.client.count({
            where: { tenantId: pref.tenantId, createdAt: { gte: yesterday } },
          }),
          this.prisma.notification.count({
            where: {
              tenantId: pref.tenantId,
              createdAt: { gte: yesterday },
              priority: NotifPriority.HIGH,
            },
          }),
        ]);

        await this.notifs.createFromTemplate(
          pref.tenantId,
          NotifType.RAPPORT_JOURNALIER,
          { ventesJour, nouveauClients, alertes },
          pref.userId,
        );
      } catch (e) {
        this.logger.error(
          `Erreur digest tenant ${pref.tenantId}: ${(e as Error).message}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    name: 'check-abonnements-expirants',
    timeZone: 'Africa/Douala',
  })
  async checkAbonnementsExpirants(): Promise<void> {
    const now = new Date();
    const j7 = new Date(now);
    j7.setDate(j7.getDate() + 7);
    const j3 = new Date(now);
    j3.setDate(j3.getDate() + 3);
    const j1 = new Date(now);
    j1.setDate(j1.getDate() + 1);

    await this.sendExpiryForDate(j7, NotifType.EXPIRY_J7);
    await this.sendExpiryForDate(j3, NotifType.EXPIRY_J3);
    await this.sendExpiryForDate(j1, NotifType.EXPIRY_J1);
  }

  private async sendExpiryForDate(
    targetDate: Date,
    notifType: NotifType,
  ): Promise<void> {
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        estActif: true,
        dateExpiration: { gte: start, lte: end },
      },
    });

    for (const tenant of tenants) {
      if (!tenant.dateExpiration) continue;
      await this.notifs.createFromTemplate(tenant.id, notifType, {
        plan: tenant.plan || 'Standard',
        dateExpiration: tenant.dateExpiration.toISOString().split('T')[0],
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'clean-expired-notifications',
    timeZone: 'Africa/Douala',
  })
  async cleanExpiredNotifications(): Promise<void> {
    await this.notifs.deleteExpired();
  }

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'retry-failed-notifications',
    timeZone: 'Africa/Douala',
  })
  async retryFailedNotifications(): Promise<void> {
    this.logger.log('Retry des notifications échouées...');
    const maxRetries = 5;
    const failed = await this.prisma.notification.findMany({
      where: {
        deliveryStatus: 'FAILED' as any,
        retryCount: { lt: maxRetries },
      },
    });

    for (const notif of failed) {
      try {
        await this.prisma.notification.update({
          where: { id: notif.id },
          data: {
            retryCount: notif.retryCount + 1,
            deliveryStatus: 'PENDING' as any,
          },
        });
      } catch (e) {
        this.logger.error(
          `Retry échoué pour notif ${notif.id}: ${(e as Error).message}`,
        );
      }
    }
  }
}
