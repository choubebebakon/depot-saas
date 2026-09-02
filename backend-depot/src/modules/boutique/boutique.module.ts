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
    DepensesService,
    VentesService,
  ],
})
export class BoutiqueModule {}
