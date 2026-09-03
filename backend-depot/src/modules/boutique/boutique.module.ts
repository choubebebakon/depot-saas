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

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [BoutiqueController, DepensesProductionController],
  providers: [
    PromotionsService,
    CreditClientService,
    ArticlesService,
    StockService,
    ClientsService,
    FournisseursService,
    DepensesService,
    DepensesProductionService,
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
    VentesService,
  ],
})
export class BoutiqueModule {}