import { Module } from '@nestjs/common';
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
import { ProductionBoutiqueVentesService } from './production-stock.service';
import { BoutiqueController } from './boutique.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [BoutiqueController],
  providers: [
    PromotionsService,
    CreditClientService,
    ArticlesService,
    StockService,
    ClientsService,
    FournisseursService,
    DepensesService,
    DepensesProductionService,
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