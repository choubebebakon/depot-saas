import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../../audit/audit.module';
import { SupermarcheController } from './supermarche.controller';
import { SupermarcheService } from './supermarche.service';
import { SupermarchePosService } from './supermarche-pos.service';
import { ProductionSupermarcheStockService } from './production-stock.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SupermarcheController],
  providers: [
    ProductionSupermarcheStockService,
    SupermarchePosService,
    {
      provide: SupermarcheService,
      useExisting: ProductionSupermarcheStockService,
    },
  ],
  exports: [SupermarcheService],
})
export class SupermarcheModule {}
