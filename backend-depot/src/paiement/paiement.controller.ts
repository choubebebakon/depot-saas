import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from '../payments/payments.service'; // On importe le service unifié

@Controller('paiements')
export class PaiementController {
  private readonly logger = new Logger(PaiementController.name);

  // On injecte le NOUVEAU service pour centraliser la logique
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    this.logger.warn(`[DÉPRÉCIÉ] Webhook reçu sur l'ancienne route /paiements/webhook. Redirection vers PaymentsService.`);

    try {
      // Si le payload vient de NotchPay/Campay sous l'ancienne route, on le passe au nouveau handler
      return await this.paymentsService.handleWebhookNotification(payload);
    } catch (error: any) {
      this.logger.error(`Échec du traitement du webhook déprécié : ${error.message}`);
      return { received: true, status: 'FAILED_IN_REDIRECT' };
    }
  }
}