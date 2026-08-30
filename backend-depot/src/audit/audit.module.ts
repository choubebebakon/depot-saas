import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditGateway } from './audit.gateway';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  controllers: [AuditController],
  providers: [AuditService, PrismaService, AuditGateway, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}