import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RealtimeModule } from '../common/realtime/realtime.module';
import { AuditModule } from '../audit/audit.module';
import { CrmApiKeyService } from './crm-api-key.service';
import { CrmController } from './crm.controller';
import { CrmCustomerService } from './crm-customer.service';
import { CrmLogger } from './crm-logger.service';
import { CrmService } from './crm-service';
import { CrmSettingsController } from './crm-settings.controller';
import { CrmSettingsService } from './crm-settings.service';
import { CrmApiKeyGuard } from './guards/crm-api-key.guard';

/**
 * Module CRM omnicanal (WhatsApp Business / Instagram DM / Facebook Messenger).
 *
 * Deux surfaces d'API distinctes, une seule implémentation de la logique :
 * - /api/v1/crm          : machine-à-machine (clé API), pour l'agent IA.
 * - /api/v1/crm-settings : session utilisateur (JWT + rôles PATRON/GERANT),
 *   pour le réglage des paramètres métier par shop (contrainte n°12/13).
 *
 * `AuditModule` est requis par la seconde surface : `CrmSettingsController`
 * utilise `AuditInterceptor` (journal patron des modifications, même
 * traçabilité que `PATCH /tenant/:id`), dont la dépendance `AuditService` est
 * fournie/exportée par `AuditModule`. `CrmController` reste machine-à-machine
 * et n'utilise pas l'audit.
 */
@Module({
  imports: [RealtimeModule, AuditModule],
  controllers: [CrmController, CrmSettingsController],
  providers: [
    PrismaService,
    CrmLogger,
    CrmSettingsService,
    CrmApiKeyService,
    CrmCustomerService,
    CrmService,
    CrmApiKeyGuard,
  ],
  // Exposés pour un usage interne (seed de clés, portefeuille clients du
  // back-office, futurs jobs de relance).
  exports: [CrmService, CrmApiKeyService, CrmSettingsService],
})
export class CrmModule {}