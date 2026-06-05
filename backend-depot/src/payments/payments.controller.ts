import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator'; // Utilise ton décorateur Public existant

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Crée un paiement en attente avant confirmation via NotchPay/Campay.
   * Protégé par JWT.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('init')
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @ApiOperation({ summary: 'Initialiser un paiement (NotchPay/Campay/Stripe)' })
  @ApiResponse({ status: 201, description: 'Paiement initié avec succès.' })
  @ApiResponse({ status: 400, description: 'Données de paiement invalides.' })
  async init(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.createPendingPayment({
      tenantId: user.tenantId,
      planPurchased: createPaymentDto.planPurchased,
      billingCycle: createPaymentDto.billingCycle,
      method: createPaymentDto.method,
      channel: createPaymentDto.channel,
      customerEmail: user.email,
      momoPhoneNumber: createPaymentDto.momoPhoneNumber || null,
    });
  }

  // ==========================================
  //     WEBHOOKS PUBLICS (SANS GUARD JWT)
  // ==========================================

  /**
   * Webhook global ou NotchPay pour capturer les confirmations de transaction.
   * Doit être public car appelé directement par le serveur NotchPay/Campay.
   */
  @Public() // Court-circuite le JwtAuthGuard global s'il est configuré
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture le webhook de confirmation de paiement standard' })
  async handleWebhook(@Body() payload: any, @Req() req: any) {
    // On extrait la signature si nécessaire pour validation dans le service
    const signature = req.headers['x-notchpay-signature'] || req.headers['signature'];
    return this.paymentsService.handleWebhookNotification(payload, signature);
  }

  /**
   * Webhook dédié à Campay (Mobile Money : MTN / Orange).
   */
  @Public()
  @Post('webhooks/campay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture le webhook de confirmation Campay' })
  async handleCampayWebhook(@Body() payload: any) {
    return this.paymentsService.handleCampayNotification(payload);
  }
}