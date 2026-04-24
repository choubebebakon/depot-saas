import { Module } from '@nestjs/common';
import { DlcService } from './dlc.service';
import { DlcController } from './dlc.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [DlcController],
    providers: [DlcService, PrismaService],
    exports: [DlcService],
})
export class DlcModule { }
