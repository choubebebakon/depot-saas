import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MetaGraphApiService } from './services/meta-graph-api.service';
import { MetaTokenCryptoService } from './services/meta-token-crypto.service';
import { MetaTokenGuardService } from './services/meta-token-guard.service';
import { MetaIntegrationService } from './services/meta-integration.service';
import { MetaWebhookService } from './services/meta-webhook.service';
import { MetaWebhookController } from './controllers/meta-webhook.controller';
import { MetaIntegrationsController } from './controllers/meta-integrations.controller';
import { loadMetaConfig, META_CONFIG } from './meta.config';

/** Budget maximal d'un appel Graph API (ms) — au-delà, l'appel échoue proprement. */
const META_HTTP_TIMEOUT_MS = 15_000;

/**
 * Module d'intégration native Meta — WhatsApp Cloud API (Embedded Signup),
 * Instagram DM et Messenger (Facebook Login for Business).
 *
 * Sécurité : la configuration est chargée une fois au boot ; les variables
 * manquantes (META_APP_ID, META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN) sont
 * journalisées au démarrage sans faire échouer le boot en développement — les
 * endpoints concernés répondent alors 503. META_TOKEN_ENCRYPTION_KEY fait
 * exception : son absence en production bloque le démarrage (fail closed,
 * voir MetaTokenCryptoService.onModuleInit).
 */
@Module({
  imports: [
    ScheduleModule,
    /**
     * HttpService est fourni par HttpModule (@nestjs/axios) : le déclarer
     * directement dans `providers` échoue au boot (AXIOS_INSTANCE_TOKEN non
     * résolu — « Nest can't resolve dependencies of the HttpService »).
     * timeout : borne dure sur les appels Graph (aucun appel ne doit bloquer
     * le worker de webhook). maxRedirects: 0 : les endpoints Graph utilisés
     * (oauth/access_token, debug_token, register, subscribed_apps, messages)
     * répondent toujours directement ; suivre une redirection sortante serait
     * un vecteur d'exfiltration du token vers un hôte tiers.
     */
    HttpModule.register({
      timeout: META_HTTP_TIMEOUT_MS,
      maxRedirects: 0,
    }),
  ],
  controllers: [MetaWebhookController, MetaIntegrationsController],
  providers: [
    { provide: META_CONFIG, useFactory: loadMetaConfig },
    MetaTokenCryptoService,
    MetaGraphApiService,
    MetaIntegrationService,
    MetaWebhookService,
    MetaTokenGuardService,
  ],
  exports: [MetaIntegrationService, MetaGraphApiService],
})
export class MetaModule {}


