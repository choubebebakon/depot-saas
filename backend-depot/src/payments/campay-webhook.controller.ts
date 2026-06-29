import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma.service';
import { PaymentsService } from './payments.service';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

interface CampayWebhookPayload {
  status?: string;
  reference?: string;
  external_reference?: string;
  operator_tx_id?: string;
}

/**
 * Controleur webhook pour les notifications MTN MoMo via Campay.
 *
 * Validation Webhook Campay (Anti-fraude obligatoire):
 * ① Extraire : header X-Campay-Signature
 * ② Calculer : HMAC-SHA256(rawBody, CAMPAY_WEBHOOK_SECRET)
 * ③ Comparer : crypto.timingSafeEqual(expected, received)
 * ④ Si invalide → HTTP 401
 * ⑤ Si valide   → traiter le paiement
 *
 * Idempotence MoMo :
 * → Verifier si Payment.operatorTxId existe deja en base
 * → Si oui : return HTTP 200 immediatement (aucune modification)
 * → Si non : creer + mettre a jour l'acces tenant
 */
@ApiTags('Payments Webhooks')
@Controller('payments/webhooks/campay')
export class CampayWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Recoit les notifications Campay apres validation HMAC-SHA256.
   * Route publique protegee par signature HMAC.
   *
   * @param request - Requete Express avec rawBody pour validation HMAC
   * @param signature - Signature HMAC du webhook (header X-Campay-Signature)
   * @returns Statut de traitement du webhook
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Campay MTN MoMo' })
  @ApiResponse({ status: 200, description: 'Webhook traite avec succes' })
  @ApiResponse({ status: 401, description: 'Signature invalide' })
  async handleWebhook(
    @Req() request: RequestWithRawBody,
    @Headers('x-campay-signature') signature: string | undefined,
  ): Promise<{ received: true; status: string }> {
    this.assertValidSignature(request.rawBody, signature);

    const payload = request.body as CampayWebhookPayload;
    const transactionId = payload.operator_tx_id ?? payload.reference;
    const paymentId = payload.external_reference;

    if (!paymentId || !transactionId) {
      return { received: true, status: 'IGNORED_INCOMPLETE' };
    }

    // Idempotence: verifier si le transactionId existe deja
    const existingPayment = await this.prisma.payment.findUnique({
      where: { operatorTxId: transactionId },
      select: { id: true },
    });

    if (existingPayment) {
      return { received: true, status: 'DUPLICATE' };
    }

    if (payload.status !== 'SUCCESSFUL' && payload.status !== 'SUCCESS') {
      await this.paymentsService.markPaymentFailed(paymentId);
      return { received: true, status: 'FAILED' };
    }

    await this.paymentsService.markPaymentSuccess(paymentId, transactionId);
    return { received: true, status: 'PROCESSED' };
  }

  /**
   * Valide la signature HMAC Campay avec comparaison constante.
   * Utilise crypto.timingSafeEqual pour prevenir les attaques timing.
   *
   * @param rawBody - Corps brut de la requete (Buffer)
   * @param signature - Signature recue dans le header X-Campay-Signature
   * @throws UnauthorizedException si la signature est invalide
   */
  private assertValidSignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): void {
    const secret = process.env.CAMPAY_WEBHOOK_SECRET;

    if (!rawBody || !signature || !secret) {
      throw new UnauthorizedException({
        error: 'WEBHOOK_INVALID',
        message: 'Signature Campay invalide.',
      });
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException({
        error: 'WEBHOOK_INVALID',
        message: 'Signature Campay invalide.',
      });
    }
  }
}
