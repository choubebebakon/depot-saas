import { Module } from '@nestjs/common';
import { CampayWebhookController } from './campay-webhook.controller';
import { CampayService } from './campay.service';
import { NotchPayService } from './notchpay.service';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripePaymentsService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule],
  controllers: [
    CampayWebhookController,
    PaymentsController,
    PaymentWebhookController,
    StripeWebhookController,
  ],
  providers: [
    CampayService,
    NotchPayService,
    PaymentsService,
    StripePaymentsService,
  ],
  exports: [
    CampayService,
    NotchPayService,
    PaymentsService,
    StripePaymentsService,
  ],
})
export class PaymentsModule {}
