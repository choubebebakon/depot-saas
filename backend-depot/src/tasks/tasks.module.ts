import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../prisma.module';
import { SentryModule } from '../common/sentry/sentry.module';
import { AppLoggerModule } from '../common/logger/logger.module';
import { PaymentsModule } from '../payments/payments.module';

/**
 * Module des taches planifiees (CRON) pour GeStock.
 *
 * Taches:
 * - Relances automatiques: J-7, J-3, J-1 avant expiration
 * - Reconciliation des paiements: toutes les 24h
 * - Generation des factures PDF apres paiement
 * - Export quotidien des statistiques
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    SentryModule,
    AppLoggerModule,
    PaymentsModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
