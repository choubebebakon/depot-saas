import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../common/email/email.service';
import {
  NotifType,
  TenantStatus,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';
import { CampayService } from '../payments/campay.service';
import { PaymentsService } from '../payments/payments.service';
import { NotchPayService } from '../payments/notchpay.service';

/**
 * Service des taches planifiees (CRON) pour GeStock.
 *
 * Relances automatiques:
 * - J-7: email + notification dashboard
 * - J-3: email urgent + notification dashboard
 * - J-1: email final + lien de paiement direct
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campay: CampayService,
    private readonly payments: PaymentsService,
    private readonly notchPay: NotchPayService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * CRON: Relances automatiques pour les abonnements proches de l'expiration.
   * Execute tous les jours a 9h00 (heure du Cameroun, UTC+1).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    name: 'expiry-reminders',
    timeZone: 'Africa/Douala',
  })
  async handleExpiryReminders(): Promise<void> {
    this.logger.log('Starting expiry reminders CRON job');

    try {
      const now = new Date();

      const j7Date = new Date(now);
      j7Date.setDate(j7Date.getDate() + 7);

      const j3Date = new Date(now);
      j3Date.setDate(j3Date.getDate() + 3);

      const j1Date = new Date(now);
      j1Date.setDate(j1Date.getDate() + 1);

      await this.sendRemindersForDate(j7Date, NotifType.EXPIRY_J7, 7);
      await this.sendRemindersForDate(j3Date, NotifType.EXPIRY_J3, 3);
      await this.sendRemindersForDate(j1Date, NotifType.EXPIRY_J1, 1);

      this.logger.log('Expiry reminders CRON job completed');
    } catch (error) {
      this.logger.error('Expiry reminders CRON job failed', error);
      Sentry.captureException(error, {
        tags: { alertType: 'CRON_EXPIRY_REMINDERS_FAILED' },
      });
    }
  }

  /**
   * Envoie les relances pour une date d'expiration cible.
   */
  private async sendRemindersForDate(
    targetDate: Date,
    notifType: NotifType,
    daysUntilExpiry: number,
  ): Promise<void> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: TenantStatus.ACTIVE,
        subscriptionEnd: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, email: true },
        },
      },
    });

    for (const tenant of tenants) {
      const existingNotif = await this.prisma.notification.findFirst({
        where: {
          tenantId: tenant.id,
          type: notifType,
          isSent: true,
        },
      });

      if (existingNotif) {
        this.logger.debug(
          `Notification ${notifType} already sent for tenant ${tenant.id}`,
        );
        continue;
      }

      await this.prisma.notification.create({
        data: {
          tenantId: tenant.id,
          type: notifType,
          isSent: true,
          sentAt: new Date(),
        },
      });

      this.logger.log(
        `Relance ${notifType} | tenant: ${tenant.id} (${tenant.name}) | J-${daysUntilExpiry}`,
      );

      for (const user of tenant.users) {
        if (user.email) {
          this.emailService
            .sendExpiryReminder(
              user.email,
              tenant.name || 'Votre entreprise',
              daysUntilExpiry,
              targetDate,
              tenant.planType || 'Standard',
            )
            .catch((err) =>
              this.logger.error(`Erreur envoi email relance: ${err.message}`),
            );
        }
      }
    }

    this.logger.log(`Processed ${tenants.length} reminders for ${notifType}`);
  }

  /**
   * CRON: Reconciliation des paiements PENDING.
   * Execute toutes les 24h a 2h00 du matin.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'payment-reconciliation',
    timeZone: 'Africa/Douala',
  })
  async handlePaymentReconciliation(): Promise<void> {
    this.logger.log('Starting payment reconciliation CRON job');

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const pendingPayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: { lt: twentyFourHoursAgo },
        },
        include: {
          tenant: { select: { name: true } },
        },
      });

      // Alerte Sentry CRITIQUE si > 5 transactions bloquees
      if (pendingPayments.length > 5) {
        Sentry.captureMessage(
          `CRITIQUE: ${pendingPayments.length} transactions PENDING depuis + de 24h`,
          {
            level: 'error',
            tags: { alertType: 'CRITICAL_STALE_TRANSACTIONS' },
            extra: { count: pendingPayments.length },
          },
        );
      }

      const expiredToFail: string[] = [];

      for (const payment of pendingPayments) {
        try {
          // ── Branche CAMPAY (PÉRIODE DE GRÂCE — décommissionnement en cours) ──
          // Maintenue tant que des paiements Campay en vol peuvent exister
          // (voir docs/PAYMENTS_NOTCHPAY_MIGRATION.md, point de non-retour n°1).
          if (
            payment.method === PaymentMethod.MTN_MOMO &&
            payment.operatorTxId
          ) {
            const status = await this.campay.getTransactionStatus(
              payment.operatorTxId,
            );

            if (status.status === 'SUCCESSFUL') {
              await this.payments.markPaymentSuccess(
                payment.id,
                payment.operatorTxId,
              );
              this.logger.log(`Payment ${payment.id} reconciled as SUCCESS`);
            } else if (status.status === 'FAILED') {
              await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.FAILED },
              });
              this.logger.log(`Payment ${payment.id} reconciled as FAILED`);
            }
            continue;
          }

          // ── Branche NOTCHPAY (filet de sécurité si webhook perdu) ──
          // Vérification "pull" auprès de l'API : ne modifie l'état QUE sur
          // une réponse explicite (complete → SUCCESS, failed → FAILED).
          // Une erreur API laisse le paiement PENDING (retry au prochain
          // passage) — jamais de bascule en FAILED sur une indisponibilité.
          const reference = payment.notchPayId ?? payment.reference;
          if (reference) {
            try {
              const tx = await this.notchPay.verifyTransaction(reference);
              const txStatus = String(tx.status ?? '').toLowerCase();
              if (
                [
                  'complete',
                  'completed',
                  'success',
                  'successful',
                  'accepted',
                  'approved',
                  'paid',
                ].includes(txStatus)
              ) {
                await this.payments.markPaymentSuccess(
                  payment.id,
                  tx.id ?? payment.notchPayId ?? payment.id,
                );
                this.logger.log(
                  `Payment ${payment.id} reconciled as SUCCESS (NotchPay pull)`,
                );
              } else if (
                ['failed', 'canceled', 'cancelled', 'expired'].includes(
                  txStatus,
                )
              ) {
                await this.payments.markNotchPayComplete({
                  reference: payment.reference ?? undefined,
                  notchPayId: payment.notchPayId ?? undefined,
                  status: 'failed',
                });
                this.logger.log(
                  `Payment ${payment.id} reconciled as FAILED (NotchPay pull)`,
                );
              }
              continue;
            } catch {
              // API injoignable : on ne bascule RIEN cette nuit, réessai demain.
              this.logger.warn(
                `NotchPay verify injoignable pour ${payment.id} — paiement laissé PENDING`,
              );
              continue;
            }
          }

          // ── PENDING orphelin (> 24h, sans aucune référence opérateur) ──
          // L'initialisation n'a jamais abouti : aucune transaction n'existe
          // côté agrégateur, il est sûr de le basculer en FAILED (contrainte 12).
          expiredToFail.push(payment.id);
        } catch (e) {
          this.logger.error(`Failed to reconcile payment ${payment.id}`, e);
        }
      }

      // Expiration en masse des PENDING orphelins (aucune activation possible
      // : pas de transaction à reconcilier). Idempotent : un replay webhook
      // ultérieur resterait no-op grâce à canTransitionTo si jamais payé
      // ailleurs — et un orphelin ne peut pas être payé (init jamais abouti).
      if (expiredToFail.length > 0) {
        const result = await this.prisma.payment.updateMany({
          where: { id: { in: expiredToFail }, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        });
        this.logger.log(
          `${result.count} paiements PENDING orphelins expirés en FAILED`,
        );
      }

      this.logger.log(
        `Reconciliation | ${pendingPayments.length} paiements PENDING traites`,
      );
    } catch (error) {
      this.logger.error('Payment reconciliation CRON job failed', error);
      Sentry.captureException(error, {
        tags: { alertType: 'CRON_RECONCILIATION_FAILED' },
      });
    }
  }

  /**
   * CRON: Nettoyage des notifications anciennes (> 6 mois).
   * Execute tous les dimanches a 3h00 du matin.
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'cleanup-notifications',
    timeZone: 'Africa/Douala',
  })
  async handleNotificationCleanup(): Promise<void> {
    this.logger.log('Starting notification cleanup CRON job');

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const deleted = await this.prisma.notification.deleteMany({
        where: {
          isSent: true,
          sentAt: { lt: sixMonthsAgo },
        },
      });

      this.logger.log(`Cleaned up ${deleted.count} old notifications`);
    } catch (error) {
      this.logger.error('Notification cleanup CRON job failed', error);
    }
  }
}
