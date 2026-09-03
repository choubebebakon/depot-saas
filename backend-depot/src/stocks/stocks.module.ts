import { Module } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { InventaireService } from './inventaire.service';
import { InventaireController } from './inventaire.controller';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StocksController, InventaireController],
  providers: [StocksService, InventaireService, PrismaService],
})
export class StocksModule {}
