import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { BillingCycle, PaymentMethod, PlanType } from '@prisma/client';

import { PaymentsService } from '../payments/payments.service';

import { InitializeBillingDto } from './dto/initialize-billing.dto';

import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

import { PlanChangeService } from './services/plan-change.service';

import { WebhookIdempotencyService } from './services/webhook-idempotency.service';

import {
  DEFAULT_COUNTRY_ISO2,
  isChannelSupported,
  isPaymentMethodAllowed,
} from '../common/config/notchpay-channels.config';

// FAIT VALIDÉ n°6 : les codes canal sont les IDs RÉELS de GET /channels
// ('cm.mtn', 'cm.orange') — pas les slugs suffixes ('mtn', 'orange').
const METHOD_TO_CHANNEL: Record<string, string> = {
  [PaymentMethod.MTN_MOMO]: 'cm.mtn',

  [PaymentMethod.ORANGE_MONEY]: 'cm.orange',

  [PaymentMethod.VISA_CARD]: 'card',

  [PaymentMethod.MASTERCARD]: 'card',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly paymentsService: PaymentsService,

    private readonly planChangeService: PlanChangeService,

    private readonly idempotency: WebhookIdempotencyService,
  ) {}

  /**

   * Devis d'un changement de plan (upgrade/downgrade) sans initier le paiement.

   */

  async quote(
    user: AuthenticatedUser,

    planId: PlanType,

    billingCycle: BillingCycle,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Tenant requis.');
    }

    return this.planChangeService.quotePlanChange(
      user.tenantId,

      planId,

      billingCycle,
    );
  }

  /**

   * Initialise un paiement NotchPay avec gestion upgrade/downgrade et URLs de retour.

   */

  async initialize(user: AuthenticatedUser, dto: InitializeBillingDto) {
    if (!user.tenantId) {
      throw new BadRequestException(
        'Tenant requis pour initialiser un paiement.',
      );
    }

    const quote = await this.planChangeService.quotePlanChange(
      user.tenantId,

      dto.planId,

      dto.billingCycle,
    );

    const channel =
      dto.channel ?? METHOD_TO_CHANNEL[dto.paymentMethod] ?? 'card';

    // PARTIE 2 (contrainte 8) : validation contre la couverture NotchPay
    // RÉELLE du compte (config centralisée), fail-closed sur les pays/canaux
    // non couverts — pas de liste "supposée".
    const country = dto.country ?? DEFAULT_COUNTRY_ISO2;
    if (!isPaymentMethodAllowed(country, dto.paymentMethod)) {
      throw new BadRequestException(
        `La méthode ${dto.paymentMethod} n'est pas disponible pour le pays ${country} (couverture NotchPay).`,
      );
    }
    if (!isChannelSupported(country, channel)) {
      throw new BadRequestException(
        channel === 'card'
          ? "Le paiement par carte n'est pas encore activé sur le compte NotchPay (canal 'card' inactif — vérifié via GET /channels). Utilisez Mobile Money ou activez le canal carte auprès de NotchPay."
          : `Le canal ${channel} n'est pas disponible pour le pays ${country} (couverture NotchPay vérifiée via GET /channels).`,
      );
    }

    try {
      const result = await this.paymentsService.createPendingPayment({
        tenantId: user.tenantId,

        country,

        userId: user.userId,

        planPurchased: dto.planId,

        billingCycle: dto.billingCycle,

        method: dto.paymentMethod,

        channel,

        customerEmail: user.email,

        momoPhoneNumber: dto.momoPhoneNumber ?? null,

        customTotalAmount: quote.chargeAmount,

        changeType: quote.changeType,
      });

      const checkoutUrl =
        result.checkout?.checkoutUrl ??
        (result as { checkout_url?: string }).checkout_url;

      if (!checkoutUrl) {
        throw new InternalServerErrorException(
          'URL de paiement NotchPay indisponible.',
        );
      }

      return {
        checkout_url: checkoutUrl,

        reference: result.checkout?.reference ?? result.reference,

        amount: result.checkout?.amount ?? quote.chargeAmount,

        currency: 'XAF',

        planId: dto.planId,

        billingCycle: dto.billingCycle,

        paymentMethod: dto.paymentMethod,

        changeType: quote.changeType,

        prorataCredit: quote.prorataCredit,

        fullAmount: quote.fullAmount,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';

      this.logger.error(`Échec initialisation billing: ${message}`);

      throw error;
    }
  }

  /**

   * Traite le webhook NotchPay avec idempotence stricte.

   * Le guard NotchPayWebhookGuard valide la signature en amont.

   */

  async handleWebhook(payload: Record<string, unknown>) {
    const transaction = (payload?.data ?? payload?.transaction) as
      | Record<string, unknown>
      | undefined;

    const event = String(payload?.event ?? payload?.type ?? 'unknown');

    const eventKey = String(
      transaction?.id ?? transaction?.reference ?? transaction?.trxref ?? '',
    );

    const reference = transaction?.reference as string | undefined;

    if (eventKey) {
      const reserved = await this.idempotency.tryReserve(eventKey, {
        reference,
        eventType: event,
        payload,
      });

      if (!reserved) {
        this.logger.log(
          `[Webhook] Idempotent skip (already processed/reserved): ${eventKey}`,
        );
        return { success: true, status: 'ALREADY_PROCESSED' };
      }
    }

    // Traitement effectif DOIT se faire après réservation
    const result =
      await this.paymentsService.handleWebhookNotification(payload);

    return result;
  }
}
