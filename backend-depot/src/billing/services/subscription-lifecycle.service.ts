import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
import {
  AlertType,
  BillingCycle,
  NotifType,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { EmailService } from '../../common/email/email.service';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditSeverite } from '@prisma/client';

/**
 * Moteur de cycle de vie des abonnements GesTock.
 *
 * CRON minuit (heure Douala) :
 * ─ lockExpiredTenants()     : TRIALING→TRIAL_EXPIRED, nettoie les PAST_DUE épuisés
 * ─ sendTrialAlerts()        : Alerte J-5 avant trialEndsAt
 * ─ sendRenewalAlerts()      : Alerte J-3 MONTHLY, J-14 + J-3 ANNUAL
 * ─ processDunning()         : Retries J+1, J+3, J+5 pour les PAST_DUE
 *
 * Logique de date : TOUJOURS une plage [startOfDay, startOfNextDay)
 * pour que l'heure d'exécution du CRON ne change pas le résultat.
 */
@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notifService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  // ──────────────────────────────────────────────────────────
  //  CRON PRINCIPAL — minuit heure Douala
  // ──────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'subscription-lifecycle',
    timeZone: 'Africa/Douala',
  })
  async runNightlyLifecycle(): Promise<void> {
    this.logger.log('CRON lifecycle : démarrage');
    const disableChecks =
      process.env.DISABLE_SUBSCRIPTION_CHECKS === 'true';

    if (disableChecks) {
      this.logger.warn(
        '⚠️ DISABLE_SUBSCRIPTION_CHECKS actif — CRON lifecycle ignoré',
      );
      return;
    }

    try {
      const locked = await this.lockExpiredTenants();
      const trial5 = await this.sendTrialAlerts();
      const renewal = await this.sendRenewalAlerts();
      const dunning = await this.processDunning();

      this.logger.log(
        `CRON lifecycle terminé | expirés=${locked} | alertes-trial=${trial5} | alertes-renouvellement=${renewal} | dunning=${dunning}`,
      );
    } catch (error) {
      this.logger.error('CRON lifecycle échoué', error);
      Sentry.captureException(error, {
        tags: { alertType: 'CRON_SUBSCRIPTION_LIFECYCLE_FAILED' },
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  //  VERROUILLAGE DES EXPIRÉS
  // ──────────────────────────────────────────────────────────

  /**
   * Verrouille les tenants dont le trial ou l'abonnement est expiré.
   * - TRIALING → TRIAL_EXPIRED si trialEndsAt < now
   * - PAST_DUE → CANCELED si paymentRetryCount >= 3 ET currentPeriodEnd < J-5
   */
  async lockExpiredTenants(): Promise<number> {
    const now = new Date();
    let locked = 0;

    // 1. Essais expirés
    const expiredTrials = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: { lt: now },
      },
      select: { id: true, name: true, emailPatron: true },
    });

    for (const tenant of expiredTrials) {
      await this.updateStatus(tenant.id, SubscriptionStatus.TRIAL_EXPIRED, {
        reason: 'Trial expiré sans conversion',
        auditAction: 'SUBSCRIPTION_TRIAL_EXPIRED',
      });
      locked++;
      this.logger.warn(
        `Tenant ${tenant.id} (${tenant.name}) → TRIAL_EXPIRED`,
      );
    }

    // 2. PAST_DUE épuisés (3+ retries ET currentPeriodEnd < J-5 → CANCELED)
    const expiredPastDue = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        paymentRetryCount: { gte: 3 },
        currentPeriodEnd: { lt: new Date(now.getTime() - 5 * 86400000) },
      },
      select: { id: true, name: true, emailPatron: true, planType: true },
    });

    for (const tenant of expiredPastDue) {
      await this.updateStatus(tenant.id, SubscriptionStatus.CANCELED, {
        reason: 'Dunning épuisé (3 retries)',
        auditAction: 'SUBSCRIPTION_CANCELED',
      });
      // Notification finale
      await this.notifService
        .createFromTemplate(
          tenant.id,
          NotifType.SUBSCRIPTION_CANCELED,
          { message: 'Votre abonnement a été annulé après plusieurs tentatives de paiement infructueuses.' },
        )
        .catch((e) =>
          this.logger.error(`Notif CANCELED échouée: ${e.message}`),
        );
      locked++;
      this.logger.warn(
        `Tenant ${tenant.id} (${tenant.name}) → CANCELED (dunning épuisé)`,
      );
    }

    return locked;
  }

  // ──────────────────────────────────────────────────────────
  //  ALERTES ESSAI GRATUIT (J-5)
  // ──────────────────────────────────────────────────────────

  /**
   * Envoie l'alerte J-5 pour les tenants en période d'essai.
   * Utilise une plage de date [startOfDay(today+5), startOfDay(today+6))
   * pour garantir la détection peu importe l'heure d'exécution du CRON.
   */
  async sendTrialAlerts(): Promise<number> {
    const { startOfDay, endOfDay } = this.getDayRange(5);

    this.logger.log(
      `🔍 Trial J-5 : plage ${startOfDay.toISOString()} → ${endOfDay.toISOString()}`,
    );

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: { gte: startOfDay, lt: endOfDay },
      },
      select: {
        id: true,
        name: true,
        planType: true,
        trialEndsAt: true,
        subscriptionAlerts: {
          where: { alertType: AlertType.TRIAL_J5 },
          select: { id: true },
        },
        users: {
          where: { role: 'ADMIN' },
          select: { email: true },
        },
      },
    });

    this.logger.log(`📊 Trial J-5 : ${tenants.length} tenant(s) trouvé(s)`);
    let sent = 0;

    for (const tenant of tenants) {
      // Déjà envoyé ce cycle ?
      if (tenant.subscriptionAlerts.length > 0) continue;

      const adminEmails = tenant.users.map((u) => u.email).filter(Boolean);

      // Notification in-app
      await this.notifService
        .createFromTemplate(tenant.id, NotifType.EXPIRY_J5, {
          jours: 5,
          message: `Votre période d'essai expire dans 5 jours. Choisissez un plan pour continuer.`,
          plan: tenant.planType,
        })
        .catch((e) =>
          this.logger.error(`Notif TRIAL_J5 échouée: ${e.message}`),
        );

      // Email à chaque admin
      for (const email of adminEmails) {
        this.emailService
          .sendExpiryReminder(
            email,
            tenant.name || 'Votre entreprise',
            5,
            tenant.trialEndsAt!,
            'Essai gratuit',
          )
          .catch((err) =>
            this.logger.error(`Email TRIAL_J5 ${email}: ${err.message}`),
          );
      }

      // Marque l'alerte comme envoyée
      await this.markAlertSent(tenant.id, AlertType.TRIAL_J5);
      sent++;
    }

    return sent;
  }

  // ──────────────────────────────────────────────────────────
  //  ALERTES DE RENOUVELLEMENT (MONTHLY / ANNUAL)
  // ──────────────────────────────────────────────────────────

  /**
   * Envoie les alertes de renouvellement différenciées selon billingCycle :
   * - MONTHLY : alerte J-3
   * - ANNUAL  : alerte J-14 (première) + J-3 (rappel si J-14 déjà envoyé)
   */
  async sendRenewalAlerts(): Promise<number> {
    let sent = 0;
    sent += await this.sendMonthlyRenewalAlert();
    sent += await this.sendAnnualRenewalAlerts();
    return sent;
  }

  private async sendMonthlyRenewalAlert(): Promise<number> {
    const { startOfDay, endOfDay } = this.getDayRange(3);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        currentPeriodEnd: { gte: startOfDay, lt: endOfDay },
      },
      select: {
        id: true, name: true, planType: true, currentPeriodEnd: true,
        subscriptionAlerts: {
          where: { alertType: AlertType.MONTHLY_J3 },
          select: { id: true },
        },
        users: { where: { role: 'ADMIN' }, select: { email: true } },
      },
    });

    let sent = 0;
    for (const tenant of tenants) {
      if (tenant.subscriptionAlerts.length > 0) continue;

      await this.notifService
        .createFromTemplate(tenant.id, NotifType.EXPIRY_J3, {
          jours: 3,
          message: `Votre abonnement mensuel sera renouvelé dans 3 jours. Pensez à vérifier votre moyen de paiement.`,
          plan: tenant.planType,
        })
        .catch((e) => this.logger.error(`Notif MONTHLY_J3: ${e.message}`));

      for (const { email } of tenant.users) {
        if (email) {
          this.emailService
            .sendExpiryReminder(
              email,
              tenant.name || 'Votre entreprise',
              3,
              tenant.currentPeriodEnd!,
              tenant.planType || 'Standard',
            )
            .catch((err) =>
              this.logger.error(`Email MONTHLY_J3 ${email}: ${err.message}`),
            );
        }
      }

      await this.markAlertSent(tenant.id, AlertType.MONTHLY_J3);
      sent++;
    }
    return sent;
  }

  private async sendAnnualRenewalAlerts(): Promise<number> {
    let sent = 0;

    // J-14 : Premier rappel annuel
    const range14 = this.getDayRange(14);
    const tenantsJ14 = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.YEARLY,
        currentPeriodEnd: { gte: range14.startOfDay, lt: range14.endOfDay },
      },
      select: {
        id: true, name: true, planType: true, currentPeriodEnd: true,
        subscriptionAlerts: {
          where: { alertType: AlertType.ANNUAL_J14 },
          select: { id: true },
        },
        users: { where: { role: 'ADMIN' }, select: { email: true } },
      },
    });

    for (const tenant of tenantsJ14) {
      if (tenant.subscriptionAlerts.length > 0) continue;

      await this.notifService
        .createFromTemplate(tenant.id, NotifType.EXPIRY_J14, {
          jours: 14,
          message: `Votre abonnement annuel arrive à échéance dans 14 jours. C'est le moment de prévoir votre renouvellement.`,
          plan: tenant.planType,
        })
        .catch((e) => this.logger.error(`Notif ANNUAL_J14: ${e.message}`));

      for (const { email } of tenant.users) {
        if (email) {
          this.emailService
            .sendExpiryReminder(
              email,
              tenant.name || 'Votre entreprise',
              14,
              tenant.currentPeriodEnd!,
              tenant.planType || 'Standard',
            )
            .catch((err) =>
              this.logger.error(`Email ANNUAL_J14 ${email}: ${err.message}`),
            );
        }
      }

      await this.markAlertSent(tenant.id, AlertType.ANNUAL_J14);
      sent++;
    }

    // J-3 : Rappel final annuel (uniquement si J-14 déjà reçu)
    const range3 = this.getDayRange(3);
    const tenantsJ3Annual = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.YEARLY,
        currentPeriodEnd: { gte: range3.startOfDay, lt: range3.endOfDay },
        subscriptionAlerts: {
          some: { alertType: AlertType.ANNUAL_J14 }, // J-14 doit avoir été envoyé
        },
      },
      select: {
        id: true, name: true, planType: true, currentPeriodEnd: true,
        subscriptionAlerts: {
          where: { alertType: AlertType.ANNUAL_J3 },
          select: { id: true },
        },
        users: { where: { role: 'ADMIN' }, select: { email: true } },
      },
    });

    for (const tenant of tenantsJ3Annual) {
      if (tenant.subscriptionAlerts.length > 0) continue;

      await this.notifService
        .createFromTemplate(tenant.id, NotifType.EXPIRY_J3, {
          jours: 3,
          message: `Rappel : votre abonnement annuel expire dans 3 jours. Renouvelez maintenant pour éviter toute interruption.`,
          plan: tenant.planType,
        })
        .catch((e) => this.logger.error(`Notif ANNUAL_J3: ${e.message}`));

      for (const { email } of tenant.users) {
        if (email) {
          this.emailService
            .sendExpiryReminder(
              email,
              tenant.name || 'Votre entreprise',
              3,
              tenant.currentPeriodEnd!,
              tenant.planType || 'Standard',
            )
            .catch((err) =>
              this.logger.error(`Email ANNUAL_J3 ${email}: ${err.message}`),
            );
        }
      }

      await this.markAlertSent(tenant.id, AlertType.ANNUAL_J3);
      sent++;
    }

    return sent;
  }

  // ──────────────────────────────────────────────────────────
  //  DUNNING (PAST_DUE retries J+1, J+3, J+5)
  // ──────────────────────────────────────────────────────────

  /**
   * Gère les tentatives de relance pour les tenants PAST_DUE.
   * Référence : currentPeriodEnd (date à laquelle le paiement aurait dû être fait).
   * - J+1 : 1ère tentative (paymentRetryCount = 0)
   * - J+3 : 2e tentative (paymentRetryCount = 1)
   * - J+5 : 3e tentative FINALE (paymentRetryCount = 2)
   * L'accès reste maintenu pendant toute la période PAST_DUE.
   */
  async processDunning(): Promise<number> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const retrySchedule: Array<{
      retryCount: number;
      offsetDays: number;
      alertType: AlertType;
    }> = [
      { retryCount: 0, offsetDays: 1, alertType: AlertType.PAST_DUE_RETRY_1 },
      { retryCount: 1, offsetDays: 3, alertType: AlertType.PAST_DUE_RETRY_2 },
      { retryCount: 2, offsetDays: 5, alertType: AlertType.PAST_DUE_RETRY_3 },
    ];

    let processed = 0;

    for (const schedule of retrySchedule) {
      // Fenêtre : [currentPeriodEnd + offset, currentPeriodEnd + offset + 1 jour)
      // → un tenant dont le paiement a échoué il y a exactement N jours
      const maxPeriodEnd = new Date(
        startOfToday.getTime() - schedule.offsetDays * 86400000,
      );
      const minPeriodEnd = new Date(
        maxPeriodEnd.getTime() - 86400000,
      );

      const pastDueTenants = await this.prisma.tenant.findMany({
        where: {
          subscriptionStatus: SubscriptionStatus.PAST_DUE,
          paymentRetryCount: schedule.retryCount,
          currentPeriodEnd: { gte: minPeriodEnd, lt: maxPeriodEnd },
        },
        select: {
          id: true,
          name: true,
          emailPatron: true,
          planType: true,
          currentPeriodEnd: true,
          users: { where: { role: 'ADMIN' }, select: { email: true } },
        },
      });

      for (const tenant of pastDueTenants) {
        const attemptNumber = schedule.retryCount + 1;
        this.logger.warn(
          `Dunning tentative ${attemptNumber}/3 pour tenant ${tenant.id} (${tenant.name})`,
        );

        // Notif in-app
        await this.notifService
          .createFromTemplate(tenant.id, NotifType.DUNNING_RETRY, {
            message: `Tentative de renouvellement ${attemptNumber}/3. Mettez à jour votre paiement.`,
            plan: tenant.planType,
          })
          .catch((e) =>
            this.logger.error(`Notif DUNNING ${attemptNumber}: ${e.message}`),
          );

        // Email avec lien de paiement
        const frontendUrl =
          process.env.FRONTEND_URL || 'http://localhost:5173';
        for (const { email } of tenant.users) {
          if (email) {
            this.emailService
              .sendPaymentFailed(
                email,
                tenant.name || 'Votre entreprise',
                0, // montant inconnu à ce stade — l'email contient le lien
                tenant.planType || 'Standard',
                `Tentative ${attemptNumber}/3 — Renouvelez sur ${frontendUrl}/settings/billing`,
              )
              .catch((err) =>
                this.logger.error(
                  `Email dunning ${attemptNumber} ${email}: ${err.message}`,
                ),
              );
          }
        }

        // Incrémenter le compteur de retries
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { paymentRetryCount: { increment: 1 } },
        });

        await this.markAlertSent(tenant.id, schedule.alertType);
        processed++;
      }
    }

    return processed;
  }

  // ──────────────────────────────────────────────────────────
  //  HELPERS PRIVÉS
  // ──────────────────────────────────────────────────────────

  /**
   * Calcule une plage [startOfDay(today + daysOffset), startOfDay(today + daysOffset + 1)).
   * Garantit que l'heure d'exécution du CRON n'affecte pas la détection.
   */
  private getDayRange(daysOffset: number): {
    startOfDay: Date;
    endOfDay: Date;
  } {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);

    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1); // startOfDay du lendemain (lt strict)

    return { startOfDay, endOfDay };
  }

  /**
   * Marque une alerte comme envoyée (upsert pour éviter le crash en cas
   * de race condition entre deux exécutions du CRON).
   */
  private async markAlertSent(
    tenantId: string,
    alertType: AlertType,
  ): Promise<void> {
    try {
      await this.prisma.subscriptionAlert.upsert({
        where: { tenantId_alertType: { tenantId, alertType } },
        create: { tenantId, alertType },
        update: { sentAt: new Date() },
      });
    } catch (err) {
      this.logger.error(
        `Erreur markAlertSent ${alertType} pour ${tenantId}: ${String(err)}`,
      );
    }
  }

  /**
   * Met à jour subscriptionStatus avec audit trail et nettoyage des alertes
   * du cycle précédent lors d'une activation (ACTIVE).
   */
  async updateStatus(
    tenantId: string,
    newStatus: SubscriptionStatus,
    opts: {
      reason: string;
      auditAction: string;
      extraData?: Record<string, unknown>;
    },
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true },
    });
    if (!tenant) return;

    const oldStatus = tenant.subscriptionStatus;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: newStatus,
        // Réinitialiser paymentRetryCount lors d'une activation
        ...(newStatus === SubscriptionStatus.ACTIVE
          ? { paymentRetryCount: 0, estActif: true }
          : {}),
        // Blocage total
        ...(newStatus === SubscriptionStatus.CANCELED ||
        newStatus === SubscriptionStatus.TRIAL_EXPIRED
          ? { estActif: false }
          : {}),
        ...opts.extraData,
      },
    });

    // Nettoyer les alertes du cycle précédent lors d'un renouvellement
    if (newStatus === SubscriptionStatus.ACTIVE) {
      await this.prisma.subscriptionAlert
        .deleteMany({ where: { tenantId } })
        .catch(() => {});
    }

    // Audit trail
    this.auditService
      .logEvent({
        tenantId,
        actorUserId: 'SYSTEM_CRON',
        actorRole: 'SYSTEM',
        action: 'SUBSCRIPTION_STATUS_CHANGED' as any,
        targetType: 'Tenant',
        targetId: tenantId,
        description: `${oldStatus} → ${newStatus} (${opts.reason})`,
        valeurAvant: { status: oldStatus },
        valeurApres: { status: newStatus },
        severite: AuditSeverite.CRITIQUE,
      })
      .catch(() => {});
  }
}
