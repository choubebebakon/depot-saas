import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { DepotBoissonsController } from './depot-boissons.controller';
import { DepotBoissonsService } from './depot-boissons.service';
import { DepotBoissonsPromotionsController } from './promotions.controller';
import { DepotBoissonsPromotionsService } from './promotions.service';
import { DepotBoissonsTourneesEditController } from './tournees-edit.controller';
import { DepotBoissonsTourneesEditService } from './tournees-edit.service';
import { CaisseModule } from '../../caisse/caisse.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, CaisseModule, AuditModule],
  controllers: [
    DepotBoissonsController,
    DepotBoissonsPromotionsController,
    DepotBoissonsTourneesEditController,
  ],
  providers: [
    DepotBoissonsService,
    DepotBoissonsPromotionsService,
    DepotBoissonsTourneesEditService,
  ],
  exports: [
    DepotBoissonsService,
    DepotBoissonsPromotionsService,
    DepotBoissonsTourneesEditService,
  ],
})
export class DepotBoissonsModule {}
