import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { DevisService } from './devis.service';
import { DevisController } from './devis.controller';
import { ChantierService } from './chantier.service';
import { ChantierController } from './chantier.controller';
import { QuincaillerieController } from './quincaillerie.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DevisController, ChantierController, QuincaillerieController],
  providers: [DevisService, ChantierService],
  exports: [DevisService, ChantierService],
})
export class QuincaillerieModule {}
