import { Module } from '@nestjs/common';
import { CaisseService } from './caisse.service';
import { CaisseController } from './caisse.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [CaisseController],
    providers: [CaisseService, PrismaService],
    exports: [CaisseService],
})
export class CaisseModule { }