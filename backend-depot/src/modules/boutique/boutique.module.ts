import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module'; // Chemin relatif
import { PromotionsService, CreditClientService, ArticlesService, StockService, ClientsService, FournisseursService, DepensesService, PersonnelService } from './boutique.service';
import { BoutiqueController } from './boutique.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BoutiqueController],
  providers: [
    PromotionsService,
    CreditClientService,
    ArticlesService,
    StockService,
    ClientsService,
    FournisseursService,
    DepensesService,
    PersonnelService,
  ],
  exports: [
    PromotionsService,
    CreditClientService,
    ArticlesService,
    StockService,
    ClientsService,
    FournisseursService,
    DepensesService,
    PersonnelService,
  ],
})
export class BoutiqueModule {}