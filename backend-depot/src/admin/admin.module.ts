import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminUserSecurityService } from './admin-user-security.service';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuditModule, PaymentsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminUserSecurityService, PrismaService],
})
export class AdminModule {}
