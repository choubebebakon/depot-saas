import {

  Body,

  Controller,

  Get,

  HttpCode,

  HttpStatus,

  Post,

  Query,

  UseGuards,

} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import {

  ApiBearerAuth,

  ApiOperation,

  ApiQuery,

  ApiResponse,

  ApiTags,

} from '@nestjs/swagger';

import { BillingCycle, PlanType } from '@prisma/client';

import { BillingService } from './billing.service';

import { InitializeBillingDto } from './dto/initialize-billing.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

import { Public } from '../auth/decorators/public.decorator';

import { NotchPayWebhookGuard } from './guards/notchpay-webhook.guard';

import { normalizeBillingCycle } from '../common/config/subscription-pricing.config';
import { SubscriptionLifecycleService } from './services/subscription-lifecycle.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';



@ApiTags('Billing')

@Controller('billing')

export class BillingController {

  constructor(
    private readonly billingService: BillingService,
    private readonly lifecycleService: SubscriptionLifecycleService,
  ) {}



  @ApiBearerAuth()

  @UseGuards(JwtAuthGuard)

  @Get('quote')

  @RequirePermission('abonnement', 'read')

  @ApiOperation({ summary: 'Devis upgrade/downgrade avant paiement' })

  @ApiQuery({ name: 'planId', enum: PlanType })

  @ApiQuery({ name: 'billingCycle', required: false })

  async quote(

    @CurrentUser() user: AuthenticatedUser,

    @Query('planId') planId: PlanType,

    @Query('billingCycle') billingCycle?: string,

  ) {

    return this.billingService.quote(

      user,

      planId,

      normalizeBillingCycle(billingCycle ?? 'MONTHLY'),

    );

  }



  @ApiBearerAuth()

  @UseGuards(JwtAuthGuard)

  @Post('initialize')

  @RequirePermission('abonnement', 'write')

  @Throttle({ default: { limit: 10, ttl: 60_000 } })

  @ApiOperation({

    summary: 'Initialiser un paiement NotchPay (upgrade/downgrade/renouvellement)',

  })

  @ApiResponse({ status: 201, description: 'checkout_url pour redirection NotchPay.' })

  async initialize(

    @Body() dto: InitializeBillingDto,

    @CurrentUser() user: AuthenticatedUser,

  ) {

    return this.billingService.initialize(user, dto);

  }



  @Public()

  @UseGuards(NotchPayWebhookGuard)

  @Post('webhook')

  @HttpCode(HttpStatus.OK)

  @ApiOperation({

    summary: 'Webhook NotchPay sécurisé (signature HMAC obligatoire)',

  })

  async webhook(@Body() payload: Record<string, unknown>) {

    return this.billingService.handleWebhook(payload);

  }

  // Endpoint temporaire pour tester l'alerte J-5 manuellement
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('test-expiry-alert')
  @RequirePermission('abonnement', 'write')
  @ApiOperation({ summary: 'TEST: Déclencher manuellement l\'alerte J-5' })
  async testExpiryAlert() {
    const sent = await this.lifecycleService.sendTrialAlerts();
    return { message: `Alertes J-5 envoyées à ${sent} tenant(s)` };
  }

}


