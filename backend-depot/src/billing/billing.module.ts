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
import { NotchPayWebhookController } from '../payments/notchpay-webhook.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PaymentsModule,
    ScheduleModule,
    EmailModule,
    NotificationsModule,
    AuditModule,
  ],
  // NotchPayWebhookController est enregistré ici (et non dans PaymentsModule)
  // car il dépend de BillingService pour l'idempotence des webhooks —
  // PaymentsModule est déjà importé par BillingModule, l'inverse créerait
  // une dépendance circulaire.
  controllers: [BillingController, NotchPayWebhookController],
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