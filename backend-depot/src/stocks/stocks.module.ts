import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { InventaireService } from './inventaire.service';
import { InventaireController } from './inventaire.controller';
import { LegacyInventaireGuard } from './guards/legacy-inventaire.guard';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StocksController, InventaireController],
  providers: [
    StocksService,
    InventaireService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: LegacyInventaireGuard,
    },
  ],
})
export class StocksModule {}
