import { Module } from '@nestjs/common';
import { TourneesService } from './tournees.service';
import { TourneesController } from './tournees.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [TourneesController],
    providers: [TourneesService, PrismaService],
    exports: [TourneesService],
})
export class TourneesModule { }
