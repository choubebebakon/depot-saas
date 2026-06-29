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
    const status = (
      transaction?.status ??
      payload.type ??
      payload.event ??
      ''
    ).toLowerCase();
    const reference = transaction?.trxref ?? transaction?.reference;
    const paymentId = transaction?.metadata?.paymentId;

    if (!transaction || (!reference && !paymentId)) {
      return { received: true, status: 'IGNORED_INCOMPLETE' };
    }

    if (status !== 'complete' && status !== 'payment.complete') {
      if (status === 'failed' || status === 'payment.failed') {
        await this.paymentsService.markNotchPayComplete({
          reference,
          paymentId,
          tenantId: transaction.metadata?.tenantId,
          notchPayId: transaction.id ?? transaction.reference,
          status: 'failed',
        });

        return { received: true, status: 'FAILED' };
      }

      return { received: true, status: 'IGNORED' };
    }

    await this.paymentsService.markNotchPayComplete({
      reference,
      paymentId,
      tenantId: transaction.metadata?.tenantId,
      notchPayId: transaction.id ?? transaction.reference,
      status: 'complete',
    });

    return { received: true, status: 'PROCESSED' };
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
