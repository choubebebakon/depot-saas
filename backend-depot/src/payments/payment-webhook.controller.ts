import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { NotchPayService } from './notchpay.service';
import { PaymentsService } from './payments.service';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

interface NotchPayWebhookPayload {
  type?: string;
  event?: string;
  data?:
    | NotchPayWebhookTransaction
    | { transaction?: NotchPayWebhookTransaction };
  transaction?: NotchPayWebhookTransaction;
}

interface NotchPayWebhookTransaction {
  id?: string;
  reference?: string;
  trxref?: string;
  status?: string;
  metadata?: {
    tenantId?: unknown;
    paymentId?: string;
    [key: string]: unknown;
  };
}

@ApiTags('Payments Webhooks')
@Controller('payments/webhook')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly notchPayService: NotchPayService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook NotchPay Mobile Money et carte' })
  @ApiResponse({ status: 200, description: 'Webhook traite avec succes' })
  @ApiResponse({ status: 401, description: 'Signature NotchPay invalide' })
  async handleWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('x-notch-signature') signature: string | undefined,
  ): Promise<{ received: true; status: string }> {
    this.assertValidSignature(request, signature);

    const payload = request.body as NotchPayWebhookPayload;
    const transaction = this.extractTransaction(payload);
    const reference = transaction?.trxref ?? transaction?.reference;
    const paymentId = transaction?.metadata?.paymentId;

    if (!transaction || (!reference && !paymentId)) {
      return { received: true, status: 'IGNORED_INCOMPLETE' };
    }

    // ── FAITS VALIDÉS n°3 / n°4 / n°14 (compte LIVE GesTock) ──────────────
    // Noms d'événements webhook RÉELS (orthographe exacte) :
    //   payment.created, payment.processing, payment.complete,
    //   payment.partially_pay, payment.failed, payment.cancelled (2 L),
    //   payment.expired, payment.authorized, payment.captured.
    // ⚠️ `payment.success` N'EXISTE PAS — le succès est `payment.complete`.
    // Tout événement non reconnu est ignoré proprement (log + 200, jamais
    // d'erreur → pas de boucle de retries NotchPay).
    const event = String(payload.event ?? payload.type ?? '').toLowerCase();
    const txStatus = String(transaction.status ?? '').toLowerCase();

    // SUCCÈS (contraintes 9/10) : seul déclencheur de l'activation.
    if (event === 'payment.complete' || txStatus === 'complete') {
      await this.paymentsService.markNotchPayComplete({
        reference,
        paymentId,
        tenantId: transaction.metadata?.tenantId,
        notchPayId: transaction.id ?? transaction.reference,
        status: 'complete',
      });
      return { received: true, status: 'PROCESSED' };
    }

    // ÉCHECS TERMINAUX — FAIT VALIDÉ n°4 : `payment.expired` (expiration
    // native NotchPay) est la source PRINCIPALE du timeout (contrainte 12) ;
    // `payment.cancelled` s'écrit avec DEUX L. Jamais de mutation
    // d'abonnement ici : markNotchPayComplete ne touche le tenant que si la
    // période est réellement échue (garde anti-dégradation déjà en place).
    const TERMINAL_FAILURES = new Set([
      'payment.failed',
      'failed',
      'payment.cancelled',
      'cancelled',
      'payment.expired',
      'expired',
    ]);
    if (TERMINAL_FAILURES.has(event) || TERMINAL_FAILURES.has(txStatus)) {
      await this.paymentsService.markNotchPayComplete({
        reference,
        paymentId,
        tenantId: transaction.metadata?.tenantId,
        notchPayId: transaction.id ?? transaction.reference,
        status: 'failed',
      });
      return { received: true, status: 'FAILED' };
    }

    // PAIEMENT PARTIEL : ni succès ni échec définitif (argent partiellement
    // reçu) → on NE mute RIEN (le paiement reste PENDING) et on signale pour
    // revue manuelle — décider d'un remboursement/complément est un choix
    // métier, pas un automatisme.
    if (event === 'payment.partially_pay' || txStatus === 'partially_pay') {
      this.logger.warn(
        `[Webhook] Paiement PARTIEL à revue manuelle : ref=${reference} event=${event}`,
      );
      return { received: true, status: 'PARTIAL_REVIEW' };
    }

    // ÉVÉNEMENTS INTERMÉDIAIRES CONNUS : aucun effet d'état (le paiement doit
    // rester PENDING jusqu'à un event terminal).
    const NEUTRAL_EVENTS = new Set([
      'payment.created',
      'payment.processing',
      'payment.authorized',
      'payment.captured',
      'created',
      'processing',
      'authorized',
      'captured',
    ]);
    if (NEUTRAL_EVENTS.has(event) || NEUTRAL_EVENTS.has(txStatus)) {
      return { received: true, status: 'IGNORED' };
    }

    // CONTRAINTE 14 : événement non reconnu → log + 200, pas d'erreur.
    this.logger.log(
      `[Webhook] Événement NotchPay non reconnu, ignoré : event=${event || '(aucun)'} status=${txStatus || '(aucun)'} ref=${reference}`,
    );
    return { received: true, status: 'IGNORED_UNKNOWN_EVENT' };
  }

  private assertValidSignature(
    request: RequestWithRawBody,
    signature: string | undefined,
  ): void {
    const hashKey = this.notchPayService.getWebhookSecret();
    const payload =
      request.rawBody?.toString('utf8') ?? JSON.stringify(request.body);

    if (!payload || !signature) {
      throw new UnauthorizedException({
        error: 'WEBHOOK_INVALID',
        message: 'Signature NotchPay manquante.',
      });
    }

    const expected = createHmac('sha256', hashKey)
      .update(payload)
      .digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException({
        error: 'WEBHOOK_INVALID',
        message: 'Signature NotchPay invalide.',
      });
    }
  }

  private extractTransaction(
    payload: NotchPayWebhookPayload,
  ): NotchPayWebhookTransaction | undefined {
    if (payload.transaction) return payload.transaction;

    if (payload.data && 'transaction' in payload.data) {
      return payload.data.transaction;
    }

    return payload.data as NotchPayWebhookTransaction | undefined;
  }
}
