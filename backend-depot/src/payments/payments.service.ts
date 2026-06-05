import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { BillingCycle, Payment, PaymentMethod, PaymentStatus, PlanType, NotifType, StatutAbonnement } from '@prisma/client'; // FIX #3: Import de StatutAbonnement pour typage de l'activation
import { PrismaService } from '../prisma.service';
import { EmailService } from '../common/email/email.service';
import { NotchPayService } from './notchpay.service';
import { normalizePhone } from '../utils/phone.utils';
import { NotificationsService } from '../core/notifications/notifications.service';

interface CreatePendingPaymentInput {
  tenantId: string;
  planPurchased: PlanType;
  billingCycle: BillingCycle;
  method: PaymentMethod;
  channel?: string;
  customerEmail: string;
  customerName?: string;
  momoPhoneNumber?: string | null;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notchPayService: NotchPayService,
    private readonly emailService: EmailService,
    private readonly notifService: NotificationsService,
  ) {}

  public calculateAmount(plan: PlanType, billingCycle: BillingCycle) {
    const amount = billingCycle === BillingCycle.MONTHLY ? 20000 : 200000;
    const tvaAmount = Math.round(amount * 0.1925);
    return { amount, tvaAmount, totalAmount: amount + tvaAmount };
  }

  public async createPendingPayment(input: CreatePendingPaymentInput) {
    const tenant = await this.prisma.tenant.findUnique({ 
      where: { id: input.tenantId }, 
      select: { id: true, name: true } 
    });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    const amounts = this.calculateAmount(input.planPurchased, input.billingCycle);
    
    const payment = await this.prisma.payment.create({
      data: {
        tenantId: input.tenantId,
        amount: amounts.amount,
        totalAmount: amounts.totalAmount,
        status: PaymentStatus.PENDING,
        method: input.method,
        planPurchased: input.planPurchased,
        billingCycle: input.billingCycle,
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    });

    const reference = `GST-${Date.now()}-${payment.id.slice(0, 8)}`;
    await this.prisma.payment.update({ where: { id: payment.id }, data: { reference } });

    try {
      const phone = input.momoPhoneNumber ? normalizePhone(input.momoPhoneNumber) : undefined;

      const notchPayResponse = await this.notchPayService.initializePayment({
        amount: amounts.totalAmount,
        currency: 'XAF',
        customer: { email: input.customerEmail, name: input.customerName ?? tenant.name ?? 'Client' },
        phone: phone,
        channel: input.channel,
        reference,
        description: `Paiement ${input.planPurchased}`,
      });

      const notchPayId = notchPayResponse.notchPayId ?? notchPayResponse.transaction?.id;
      const checkoutUrl = notchPayResponse.checkout_url ?? notchPayResponse.checkoutUrl;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { notchPayId },
      });

      return {
        ...payment,
        checkout: {
          publicKey: process.env.NOTCHPAY_PUBLIC_KEY,
          paymentId: notchPayId,
          checkoutUrl,
          reference,
          amount: amounts.totalAmount,
          currency: 'XAF',
          channel: input.channel,
          email: input.customerEmail,
          phone: phone,
          description: `Paiement ${input.planPurchased}`,
        },
      };
    } catch (error: any) {
      this.logger.error(`Erreur NotchPay: ${error.message}`);
      await this.markPaymentFailed(payment.id);
      throw new InternalServerErrorException('Impossible d\'initier le paiement.');
    }
  }

  public async markNotchPayComplete(input: {
    reference?: string;
    paymentId?: string;
    notchPayId?: string;
    status: string;
    tenantId?: unknown;
  }): Promise<Payment | null> {
    const status = input.status.toLowerCase();
    const payment = await this.prisma.payment.findFirst({
      where: { OR: [{ id: input.paymentId }, { reference: input.reference }, { notchPayId: input.notchPayId }] },
    });

    if (!payment) return null;
    if (status !== 'complete') return await this.markPaymentFailed(payment.id);
    return await this.markPaymentSuccess(payment.id, input.notchPayId ?? payment.id);
  }

  public async markPaymentFailed(paymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
      include: { tenant: { select: { name: true, emailPatron: true } } },
    });

    if (payment.tenant?.emailPatron) {
      this.emailService.sendPaymentFailed(
        payment.tenant.emailPatron,
        payment.tenant.name || 'Client',
        payment.totalAmount,
        payment.planPurchased as string,
      ).catch((err) => this.logger.error(`Erreur email échec paiement: ${err.message}`));
    }

    this.notifService.createFromTemplate(
      payment.tenantId,
      NotifType.PAYMENT_FAILED,
      { montant: payment.totalAmount, raison: 'Transaction refusée' },
    ).catch((e) => this.logger.error(`Erreur notif échec paiement: ${e.message}`));

    return payment;
  }

  public async markPaymentSuccess(paymentId: string, transactionId: string): Promise<Payment> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.SUCCESS, operatorTxId: transactionId },
      include: { tenant: { select: { name: true, emailPatron: true, dateExpiration: true } } }, 
    });

    // FIX #3: Logique de prolongation de l'abonnement en base
    const now = new Date();
    const base = (payment.tenant.dateExpiration && payment.tenant.dateExpiration > now)
      ? payment.tenant.dateExpiration
      : now;

    const nextExp = new Date(base);
    if (payment.billingCycle === BillingCycle.YEARLY) {
      nextExp.setFullYear(nextExp.getFullYear() + 1); // Prolongation d'un an
    } else {
      nextExp.setMonth(nextExp.getMonth() + 1); // Prolongation d'un mois
    }

    await this.prisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        statutAbonnement: StatutAbonnement.ACTIVE,
        planType: payment.planPurchased as PlanType,
        dateExpiration: nextExp,
        subscriptionEnd: nextExp,
        estActif: true,
        graceUntil: null,
      },
    });

    if (payment.tenant?.emailPatron) {
      const nextBilling = payment.periodEnd ? new Date(payment.periodEnd) : undefined;
      this.emailService.sendPaymentConfirmation(
        payment.tenant.emailPatron,
        payment.tenant.name || 'Client',
        payment.totalAmount,
        payment.planPurchased as string,
        payment.updatedAt,
        nextBilling,
      ).catch((err) => this.logger.error(`Erreur email confirmation paiement: ${err.message}`));
    }

    this.notifService.createFromTemplate(
      payment.tenantId,
      NotifType.PAYMENT_SUCCESS,
      { montant: payment.totalAmount, methode: payment.method },
    ).catch((e) => this.logger.error(`Erreur notif paiement: ${e.message}`));

    return payment;
  }

  // ==========================================
  //     HANDLERS DE WEBHOOKS (PHASE 2)
  // ==========================================

  /**
   * Traite les notifications asynchrones envoyées par le Webhook NotchPay standard.
   */
  public async handleWebhookNotification(payload: any, signature?: string): Promise<{ success: boolean }> {
    this.logger.log(`[Webhook] Notification NotchPay reçue. Événement: ${payload?.event}`);

    const transaction = payload?.data || payload?.transaction;
    const reference = transaction?.reference;
    const notchPayId = transaction?.id;
    const status = transaction?.status || payload?.status;

    if (!reference) {
      this.logger.warn('[Webhook] Référence manquante dans le payload NotchPay');
      throw new BadRequestException('Référence manquante');
    }

    const isSuccess = ['complete', 'accepted', 'approved', 'success'].includes(status?.toLowerCase());

    const result = await this.markNotchPayComplete({
      reference,
      notchPayId,
      status: isSuccess ? 'complete' : 'failed'
    });

    if (!result) {
      this.logger.warn(`[Webhook] Aucun paiement trouvé pour la référence : ${reference}`);
      throw new NotFoundException('Paiement non trouvé pour cette référence');
    }

    return { success: true };
  }

  /**
   * Traite les notifications asynchrones envoyées par Campay (MTN / Orange Money).
   */
  public async handleCampayNotification(payload: any): Promise<{ success: boolean }> {
    this.logger.log(`[Webhook] Notification Campay reçue. Statut: ${payload?.status}`);

    const reference = payload?.reference;
    const transactionId = payload?.id || payload?.transaction_id;
    const status = payload?.status;

    if (!reference) {
      this.logger.warn('[Webhook] Référence manquante dans le payload Campay');
      throw new BadRequestException('Référence manquante');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { reference },
    });

    if (!payment) {
      this.logger.warn(`[Webhook] Aucun paiement trouvé pour la référence Campay : ${reference}`);
      throw new NotFoundException('Paiement non trouvé');
    }

    if (status?.toUpperCase() === 'SUCCESSFUL') {
      await this.markPaymentSuccess(payment.id, transactionId?.toString() || reference);
    } else {
      await this.markPaymentFailed(payment.id);
    }

    return { success: true };
  }
}