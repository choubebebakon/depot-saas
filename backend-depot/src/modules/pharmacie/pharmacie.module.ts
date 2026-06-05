import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { PharmacieController } from './pharmacie.controller';
import { MedicamentsService } from './medicaments.service';
import { OrdonnancesService } from './ordonnances.service';

@Module({
  imports: [PrismaModule],
  controllers: [PharmacieController],
  providers: [MedicamentsService, OrdonnancesService],
  exports: [MedicamentsService, OrdonnancesService],
})
export class PharmacieModule {}
