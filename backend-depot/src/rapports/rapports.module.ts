import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RapportsController } from './rapports.controller';
import { RapportsService } from './rapports.service';
import { AnalysesService } from './analyses.service';
import { AnalysesController } from './analyses.controller';

@Module({
    controllers: [RapportsController, AnalysesController],
    providers: [RapportsService, AnalysesService, PrismaService],
    exports: [RapportsService, AnalysesService],
})
export class RapportsModule { }
