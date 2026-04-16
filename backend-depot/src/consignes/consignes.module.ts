import { Module } from '@nestjs/common';
import { ConsignesService } from './consignes.service';
import { ConsignesController } from './consignes.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [ConsignesController],
    providers: [ConsignesService, PrismaService],
    exports: [ConsignesService],
})
export class ConsignesModule { }