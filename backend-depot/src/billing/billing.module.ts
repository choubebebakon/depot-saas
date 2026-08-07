import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';

import { BillingController } from './billing.controller';

import { BillingService } from './billing.service';

import { PaymentsModule } from '../payments/payments.module';

import { NotchPayWebhookGuard } from './guards/notchpay-webhook.guard';

import { PlanChangeService } from './services/plan-change.service';

import { WebhookIdempotencyService } from './services/webhook-idempotency.service';

import { SubscriptionLifecycleService } from './services/subscription-lifecycle.service';

import { EmailModule } from '../common/email/email.module';

import { NotificationsModule } from '../core/notifications/notifications.module';



@Module({

  imports: [

    PaymentsModule,

    ScheduleModule,

    EmailModule,

    NotificationsModule,

  ],

  controllers: [BillingController],

  providers: [

    BillingService,

    NotchPayWebhookGuard,

    PlanChangeService,

    WebhookIdempotencyService,

    SubscriptionLifecycleService,

  ],

  exports: [BillingService, PlanChangeService, SubscriptionLifecycleService],

})

export class BillingModule {}


