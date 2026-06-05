import { Injectable } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';

/**
 * Contexte pour les logs enrichis.
 */
interface LogContext {
  tenantId?: string;
  transactionId?: string;
  method?: string;
  paymentId?: string;
  userId?: string;
  action?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Service de logging avec Pino.
 * Chaque étape du flux de paiement est loggée avec son contexte complet.
 *
 * Format JSON structuré:
 * { timestamp, level, tenantId, transactionId, method, action, message, ...context }
 *
 * Niveaux: ERROR | WARN | INFO | DEBUG
 */
@Injectable()
export class LoggerService {
  constructor(private readonly pinoLogger: PinoLogger) {}

  /**
   * Log de niveau ERROR - erreurs critiques nécessitant une intervention.
   */
  error(message: string, context?: LogContext): void {
    this.pinoLogger.error({ ...context, message });
  }

  /**
   * Log de niveau WARN - avertissements non bloquants.
   */
  warn(message: string, context?: LogContext): void {
    this.pinoLogger.warn({ ...context, message });
  }

  /**
   * Log de niveau INFO - informations normales du flux.
   */
  info(message: string, context?: LogContext): void {
    this.pinoLogger.log({ ...context, message });
  }

  /**
   * Log de niveau DEBUG - informations détaillées pour le développement.
   */
  debug(message: string, context?: LogContext): void {
    this.pinoLogger.debug({ ...context, message });
  }

  /**
   * Logs spécifiques pour le flux de paiement.
   */

  /**
   * Log: Début d'une demande de paiement.
   */
  logPaymentInitiated(
    tenantId: string,
    paymentId: string,
    method: string,
    plan: string,
    amount: number,
  ): void {
    this.info('Payment initiated', {
      tenantId,
      paymentId,
      method,
      plan,
      amount,
      action: 'PAYMENT_INITIATED',
    });
  }

  /**
   * Log: Paiement confirmé via webhook.
   */
  logPaymentSuccess(
    tenantId: string,
    paymentId: string,
    method: string,
    transactionId: string,
    amount: number,
  ): void {
    this.info('Payment successful', {
      tenantId,
      paymentId,
      method,
      transactionId,
      amount,
      action: 'PAYMENT_SUCCESS',
    });
  }

  /**
   * Log: Échec de paiement.
   */
  logPaymentFailed(
    tenantId: string,
    paymentId: string,
    method: string,
    reason: string,
  ): void {
    this.warn('Payment failed', {
      tenantId,
      paymentId,
      method,
      reason,
      action: 'PAYMENT_FAILED',
    });
  }

  /**
   * Log: Webhook reçu et validé.
   */
  logWebhookReceived(provider: string, transactionId?: string, status?: string): void {
    this.info('Webhook received', {
      provider,
      transactionId,
      status,
      action: 'WEBHOOK_RECEIVED',
    });
  }

  /**
   * Log: Signature webhook invalide (tentative de fraude).
   */
  logInvalidWebhookSignature(provider: string, signature?: string): void {
    this.error('Invalid webhook signature', {
      provider,
      signature: signature ? `${signature.substring(0, 16)}...` : undefined,
      action: 'WEBHOOK_INVALID_SIGNATURE',
    });
  }

  /**
   * Log: Transaction dupliquée (idempotence).
   */
  logDuplicateTransaction(provider: string, transactionId: string): void {
    this.warn('Duplicate transaction detected', {
      provider,
      transactionId,
      action: 'DUPLICATE_TRANSACTION',
    });
  }

  /**
   * Log: CRON de reconciliation exécuté.
   */
  logReconciliationCron(pendingCount: number, processedCount: number, failedCount: number): void {
    this.info('Reconciliation CRON executed', {
      pendingCount,
      processedCount,
      failedCount,
      action: 'RECONCILIATION_CRON',
    });
  }

  /**
   * Log: Alerte quota atteint.
   */
  logQuotaReached(tenantId: string, current: number, max: number): void {
    this.warn('Depot quota reached', {
      tenantId,
      current,
      max,
      action: 'QUOTA_REACHED',
    });
  }

  /**
   * Log: Changement de statut tenant.
   */
  logTenantStatusChange(tenantId: string, oldStatus: string, newStatus: string): void {
    this.info('Tenant status changed', {
      tenantId,
      oldStatus,
      newStatus,
      action: 'TENANT_STATUS_CHANGE',
    });
  }

  /**
   * Log: Relance envoyée (J-7, J-3, J-1).
   */
  logReminderSent(tenantId: string, type: 'EXPIRY_J7' | 'EXPIRY_J3' | 'EXPIRY_J1', daysUntilExpiry: number): void {
    this.info('Reminder notification sent', {
      tenantId,
      type,
      daysUntilExpiry,
      action: 'REMINDER_SENT',
    });
  }

  /**
   * Log: Facture générée.
   */
  logInvoiceGenerated(tenantId: string, paymentId: string, amount: number): void {
    this.info('Invoice generated', {
      tenantId,
      paymentId,
      amount,
      action: 'INVOICE_GENERATED',
    });
  }
}
