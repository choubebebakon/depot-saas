import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BillingService } from '../billing/billing.service';
import { Public } from '../auth/decorators/public.decorator';
import { NotchPayService } from './notchpay.service';

interface RequestWithRawBody {
  rawBody?: Buffer;
  headers: Record<string, any>;
}

@ApiTags('Payments NotchPay Webhooks')
@Controller('payments/notchpay')
export class NotchPayWebhookController {
  private readonly logger = new Logger(NotchPayWebhookController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly notchPayService: NotchPayService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook NotchPay - paiement' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('x-notchpay-signature') signature: string | undefined,
    @Body() payload: any,
  ) {
    // SECURITY : Vérification stricte de la signature via le rawBody (garantit que le JSON n'est pas altéré)
    const raw = req?.rawBody;
    if (!raw || !signature) {
      throw new BadRequestException(
        'Signature NotchPay manquante ou rawBody indisponible',
      );
    }

    const rawString = raw.toString('utf8');

    const isValid = this.notchPayService.verifyWebhookSignature(
      rawString,
      signature,
    );

    if (!isValid) {
      this.logger.warn('NotchPay webhook: signature invalide');
      throw new BadRequestException('Signature NotchPay invalide');
    }

    // IDP + traitement (Délégué à BillingService pour appliquer l'idempotence AVANT le traitement)
    const result = await this.billingService.handleWebhook(payload);
    
    // Le BillingService retourne ALREADY_PROCESSED si l'idempotence a rejeté, 
    // on renvoie toujours un 200 au proxy pour éviter les retries NotchPay inutiles.
    return { received: true, status: (result as any).status || 'PROCESSED' };
  }
}
