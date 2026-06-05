import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module'; // Chemin relatif
import { PromotionsService } from './boutique.service';
import { CreditClientService } from './boutique.service';
import { BoutiqueController } from './boutique.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BoutiqueController],
  providers: [PromotionsService, CreditClientService],
  exports: [PromotionsService, CreditClientService],
})
export class BoutiqueModule {}