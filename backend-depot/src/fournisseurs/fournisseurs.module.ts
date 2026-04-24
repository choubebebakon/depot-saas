import { Module } from '@nestjs/common';
import { FournisseursService } from './fournisseurs.service';
import { FournisseursController } from './fournisseurs.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [FournisseursController],
    providers: [FournisseursService, PrismaService],
    exports: [FournisseursService],
})
export class FournisseursModule { }
