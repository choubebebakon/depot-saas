import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaService } from '../prisma.service';
import { CrmSettingsService } from '../crm/crm-settings.service';

@Module({
  controllers: [ClientsController],
  // CrmSettingsService : fournit la limite de pagination métier de l'historique
  // (Tenant.parametres.crm.history) — le back-office respecte le réglage du shop.
  providers: [ClientsService, PrismaService, CrmSettingsService],
  exports: [ClientsService],
})
export class ClientsModule {}
