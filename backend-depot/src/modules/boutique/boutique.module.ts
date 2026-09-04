import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../../audit/audit.module';
import {
  PromotionsService,
  CreditClientService,
  ArticlesService,
  StockService,
  ClientsService,
  FournisseursService,
  DepensesService,
  VentesService,
} from './boutique.service';
import { DepensesProductionService } from './depenses-production.service';
import { DepensesProductionController } from './depenses-production.controller';
import { ProductionBoutiqueVentesService } from './production-stock.service';
import { BoutiqueController } from './boutique.controller';
import { LegacyBoutiqueDepensesGuard } from '../../common/guards/legacy-boutique-depenses.guard';
import { PromotionsProductionService } from './promotions-production.service';
import { PromotionsProductionController } from './promotions-production.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [BoutiqueController, DepensesProductionController, PromotionsProductionController],
  providers: [
    PromotionsService,
    CreditClientService,
    ArticlesService,
    StockService,
    ClientsService,
    FournisseursService,
    DepensesService,
    DepensesProductionService,
    PromotionsProductionService,
    {
      provide: APP_GUARD,
      useClass: LegacyBoutiqueDepensesGuard,
    },
    ProductionBoutiqueVentesService,
    {
      provide: VentesService,
      useExisting: ProductionBoutiqueVentesService,
    },
  ],
  exports: [
    PromotionsService,
    CreditClientService,
    ArticlesService,
    StockService,
    ClientsService,
    FournisseursService,
    DepensesProductionService,
    PromotionsProductionService,
    VentesService,
  ],
})
export class BoutiqueModule {}