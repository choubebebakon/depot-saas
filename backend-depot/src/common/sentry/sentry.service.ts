import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

/**
 * Contexte pour le tagging Sentry.
 */
interface SentryContext {
  tenantId?: string;
  transactionId?: string;
  method?: string;
  userId?: string;
  [key: string]: string | undefined;
}

/**
 * Service Sentry pour la capture d'exceptions et le monitoring.
 * Taguer CHAQUE event : { tenantId, transactionId, method }
 *
 * Alertes obligatoires configurées :
 * - Signature webhook invalide (MoMo ou Stripe)
 * - Transaction PENDING > 24h (> 5 = niveau CRITIQUE)
 * - ForbiddenException QuotaDepot
 * - Toute exception non gérée (500)
 */
@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  /**
   * Capture une exception avec contexte enrichi.
   *
   * @param error - L'erreur à capturer
   * @param context - Contexte additionnel (tenantId, transactionId, method, etc.)
   * @param level - Niveau de sévérité (fatal, error, warning, info, debug)
   */
  captureException(
    error: Error,
    context?: SentryContext,
    level: Sentry.SeverityLevel = 'error',
  ): void {
    try {
      Sentry.withScope((scope) => {
        // Ajouter les tags contextuels
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            if (value) {
              scope.setTag(key, value);
            }
          });
        }

        // Définir le niveau de sévérité
        scope.setLevel(level);

        // Capturer l'exception
        Sentry.captureException(error);
      });

      this.logger.log(
        JSON.stringify({
          action: 'sentry_capture',
          error: error.message,
          ...context,
        }),
      );
    } catch (captureError) {
      this.logger.error('Failed to capture exception to Sentry', captureError);
    }
  }

  /**
   * Capture un message avec contexte enrichi.
   *
   * @param message - Le message à capturer
   * @param context - Contexte additionnel
   * @param level - Niveau de sévérité
   */
  captureMessage(
    message: string,
    context?: SentryContext,
    level: Sentry.SeverityLevel = 'info',
  ): void {
    try {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            if (value) {
              scope.setTag(key, value);
            }
          });
        }

        scope.setLevel(level);
        Sentry.captureMessage(message);
      });
    } catch (captureError) {
      this.logger.error('Failed to capture message to Sentry', captureError);
    }
  }

  /**
   * Alertes spécifiques pour GeStock.
   */

  /**
   * Alerte : Signature webhook invalide (MoMo ou Stripe).
   * Niveau : error
   */
  alertInvalidWebhookSignature(provider: 'campay' | 'stripe', context?: SentryContext): void {
    const error = new Error(`Invalid webhook signature from ${provider}`);
    this.captureException(error, { ...context, provider, alertType: 'INVALID_WEBHOOK_SIGNATURE' }, 'error');
  }

  /**
   * Alerte : Transaction PENDING depuis plus de 24h.
   * Niveau : warning pour 1-5 transactions, fatal pour > 5.
   */
  alertStalePendingTransactions(count: number, context?: SentryContext): void {
    const level: Sentry.SeverityLevel = count > 5 ? 'fatal' : 'warning';
    this.captureMessage(
      `${count} transactions PENDING depuis plus de 24h`,
      { ...context, staleTransactionCount: count.toString(), alertType: 'STALE_PENDING_TRANSACTIONS' },
      level,
    );
  }

  /**
   * Alerte : Quota de dépôts atteint.
   * Niveau : warning
   */
  alertQuotaReached(tenantId: string, maxDepots: number, currentCount: number): void {
    this.captureMessage(
      `Quota de dépôts atteint: ${currentCount}/${maxDepots}`,
      { tenantId, maxDepots: maxDepots.toString(), currentCount: currentCount.toString(), alertType: 'QUOTA_REACHED' },
      'warning',
    );
  }

  /**
   * Alerte : Exception non gérée (500).
   * Niveau : fatal
   */
  alertUnhandledException(error: Error, context?: SentryContext): void {
    this.captureException(error, { ...context, alertType: 'UNHANDLED_EXCEPTION' }, 'fatal');
  }
}
