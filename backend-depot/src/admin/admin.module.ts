import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
