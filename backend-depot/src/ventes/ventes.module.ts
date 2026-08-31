import { Module } from '@nestjs/common';
import { VentesService } from './ventes.service';
import { VentesController } from './ventes.controller';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';
import { AuditModule } from '../audit/audit.module';
import { DlcModule } from '../dlc/dlc.module';

@Module({
  imports: [AuditModule, DlcModule],
  controllers: [VentesController],
  providers: [VentesService, PrismaService, DepotScopeService],
  exports: [VentesService],
})
export class VentesModule {}
