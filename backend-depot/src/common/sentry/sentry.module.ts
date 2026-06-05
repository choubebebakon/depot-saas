import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';

/**
 * Module Sentry pour le monitoring et les alertes d'erreurs.
 * Configure automatiquement Sentry avec le DSN depuis les variables d'environnement.
 *
 * Alertes obligatoires :
 * - Signature webhook invalide (MoMo ou Stripe)
 * - Transaction PENDING > 24h (> 5 = niveau CRITIQUE)
 * - ForbiddenException QuotaDepot
 * - Toute exception non geree (500)
 * - Taguer CHAQUE event : { tenantId, transactionId, method }
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SENTRY_INIT',
      useFactory: (configService: ConfigService) => {
        const dsn = configService.get<string>('SENTRY_DSN');
        const environment = configService.get<string>('NODE_ENV', 'development');

        if (dsn) {
          Sentry.init({
            dsn,
            environment,
            tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
            beforeSend: (event) => {
              // Ne pas envoyer les erreurs en developpement si SENTRY_DSN n'est pas configure
              if (!dsn) {
                return null;
              }
              return event;
            },
          });
        }

        return Sentry;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SENTRY_INIT'],
})
export class SentryModule {}
