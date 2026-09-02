import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma.module';
import { DepotBoissonsController } from './depot-boissons.controller';
import { DepotBoissonsService } from './depot-boissons.service';
import { SecureDepotBoissonsVenteService } from './secure-vente.service';
import { ProductionDepotStockService } from './production-stock.service';
import { VenteConsigneSafetyInterceptor } from './vente-consigne-safety.interceptor';
import { DepotBoissonsPromotionsController } from './promotions.controller';
import { DepotBoissonsPromotionsService } from './promotions.service';
import { DepotBoissonsTourneesEditController } from './tournees-edit.controller';
import { DepotBoissonsTourneesEditService } from './tournees-edit.service';
import { TourneeWorkflowController } from './tournee-workflow.controller';
import { TourneeWorkflowService } from './tournee-workflow.service';
import { TourneeWorkflowOptionsController } from './tournee-workflow-options.controller';
import { CaisseModule } from '../../caisse/caisse.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, CaisseModule, AuditModule],
  controllers: [
    DepotBoissonsController,
    DepotBoissonsPromotionsController,
    DepotBoissonsTourneesEditController,
    TourneeWorkflowController,
    TourneeWorkflowOptionsController,
  ],
  providers: [
    {
      provide: DepotBoissonsService,
      useClass: ProductionDepotStockService,
    },
    SecureDepotBoissonsVenteService,
    ProductionDepotStockService,
    {
      provide: APP_INTERCEPTOR,
      useClass: VenteConsigneSafetyInterceptor,
    },
    DepotBoissonsPromotionsService,
    DepotBoissonsTourneesEditService,
    TourneeWorkflowService,
  ],
  exports: [
    DepotBoissonsService,
    DepotBoissonsPromotionsService,
    DepotBoissonsTourneesEditService,
    TourneeWorkflowService,
  ],
})
export class DepotBoissonsModule {}
