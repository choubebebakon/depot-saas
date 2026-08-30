import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../../audit/audit.module';
import { SupermarcheController } from './supermarche.controller';
import { SupermarcheService } from './supermarche.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SupermarcheController],
  providers: [SupermarcheService],
  exports: [SupermarcheService],
})
export class SupermarcheModule {}