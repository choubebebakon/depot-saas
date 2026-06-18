import { BadRequestException, Controller, Headers, HttpCode, HttpStatus, Post, Req, Logger } from '@nestjs/common';
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

@ApiTags('Payments Webhooks')
@Controller('payments/webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly stripePaymentsService: StripePaymentsService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Stripe carte bancaire' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async handleWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true; status: string }> {
    if (!request.rawBody || !signature) {
      throw new BadRequestException('Signature Stripe manquante.');
    }

    let event: Stripe.Event;

    try {
      event = this.stripePaymentsService.constructWebhookEvent(request.rawBody, signature);
    } catch {
      throw new BadRequestException('Signature Stripe invalide.');
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

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { paymentId, tenantId } = paymentIntent.metadata;

    if (!paymentId || !tenantId) return;

    // 1. Idempotence sécurisée : On utilise l'ID unique du paiement (paymentId) qui existe forcément
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (existingPayment?.status === PaymentStatus.SUCCESS) return;

    // 2. Traitement centralisé
    // Cette méthode de ton PaymentsService s'occupe DÉJÀ de passer le statut à SUCCESS,
    // de basculer le tenant en ACTIVE, de calculer la date d'expiration exacte,
    // et de déclencher les e-mails / notifications.
    await this.paymentsService.markPaymentSuccess(paymentId, paymentIntent.id);
    
    this.logger.log(`[Stripe Webhook] Flux de paiement complété avec succès pour le tenant ${tenantId}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { paymentId } = paymentIntent.metadata;
    if (paymentId) {
      await this.paymentsService.markPaymentFailed(paymentId);
    }
  }
}