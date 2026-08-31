import { Module } from '@nestjs/common';
import { TourneesService } from './tournees.service';
import { TourneesController } from './tournees.controller';
import { TricycleEditController } from './tricycle-edit.controller';
import { TricycleEditService } from './tricycle-edit.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TourneesController, TricycleEditController],
  providers: [TourneesService, TricycleEditService, PrismaService],
  exports: [TourneesService, TricycleEditService],
})
export class TourneesModule {}
