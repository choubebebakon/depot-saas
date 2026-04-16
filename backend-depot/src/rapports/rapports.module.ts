import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RapportsController } from './rapports.controller';
import { RapportsService } from './rapports.service';

@Module({
    controllers: [RapportsController],
    providers: [RapportsService, PrismaService],
    exports: [RapportsService],
})
export class RapportsModule { }
