import { BadRequestException, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Request } from 'express';
import Stripe from 'stripe';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma.service';
import { PaymentsService } from './payments.service';
import { StripePaymentsService } from './stripe.service';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

/**
 * Controleur webhook pour les notifications Stripe (Visa/MasterCard).
 *
 * Validation Webhook Stripe (Anti-fraude obligatoire):
 * ① stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
 * ② Si erreur de signature → HTTP 400 + log Sentry
 * ③ Events a ecouter :
 *   → payment_intent.succeeded   : activer/prolonger l'abonnement
 *   → payment_intent.payment_failed : marquer Payment FAILED + notifier
 *
 * Idempotence Stripe :
 * → Verifier si Payment.stripePaymentIntentId existe deja en base avec status SUCCESS
 * → Si oui : return HTTP 200 immediatement (aucune modification)
 * → Si non : creer + mettre a jour l'acces tenant
 */
@ApiTags('Payments Webhooks')
@Controller('payments/webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly stripePaymentsService: StripePaymentsService,
  ) {}

  /**
   * Recoit les evenements Stripe apres verification de signature.
   * Route publique protegee par verification de signature Stripe.
   *
   * @param request - Requete Express avec rawBody pour validation
   * @param signature - Signature Stripe-Signature du header
   * @returns Statut de traitement du webhook
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Stripe carte bancaire' })
  @ApiResponse({ status: 200, description: 'Webhook traite avec succes' })
  @ApiResponse({ status: 400, description: 'Signature invalide' })
  async handleWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true; status: string }> {
    if (!request.rawBody || !signature) {
      throw new BadRequestException({
        error: 'WEBHOOK_INVALID',
        message: 'Signature Stripe manquante.',
      });
    }

    let event: Stripe.Event;

    try {
      event = this.stripePaymentsService.constructWebhookEvent(request.rawBody, signature);
    } catch {
      throw new BadRequestException({
        error: 'WEBHOOK_INVALID',
        message: 'Signature Stripe invalide.',
      });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.handlePaymentSucceeded(paymentIntent);
      return { received: true, status: 'PROCESSED' };
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.handlePaymentFailed(paymentIntent);
      return { received: true, status: 'FAILED' };
    }

    return { received: true, status: 'IGNORED' };
  }

  /**
   * Active l'abonnement lie a un PaymentIntent Stripe reussi.
   * Verifie l'idempotence avant traitement.
   *
   * @param paymentIntent - PaymentIntent Stripe succeeded
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      return;
    }

    // Idempotence: verifier si le PaymentIntent a deja ete traite
    const existingPayment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, status: true },
    });

    if (existingPayment?.status === PaymentStatus.SUCCESS) {
      return;
    }

    await this.paymentsService.markPaymentSuccess(paymentId, paymentIntent.id);
  }

  /**
   * Marque le paiement lie comme echoue.
   *
   * @param paymentIntent - PaymentIntent Stripe failed
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      return;
    }

    await this.paymentsService.markPaymentFailed(paymentId);
  }
}
