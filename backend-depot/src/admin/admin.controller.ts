import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentStatus, PaymentMethod, TenantStatus, AuditSeverite } from '@prisma/client';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';

@Controller('admin')
@UseGuards(SuperAdminGuard) // Seuls les SuperAdmins ont accès
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('stats')
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('metrics')
  getRevenueMetrics() {
    return this.adminService.getRevenueMetrics();
  }

  @Get('users-by-metier')
  getUsersByMetier() {
    return this.adminService.getUsersByMetier();
  }

  @Get('subscribers-by-plan')
  getSubscribersByPlan() {
    return this.adminService.getSubscribersByPlan();
  }

  @Get('transactions')
  getTransactions(
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getTransactions({
      status,
      method,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('tenants')
  getTenants(
    @Query('status') status?: TenantStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getTenants({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('transactions/:id/reconcile')
  reconcileTransaction(@Param('id') paymentId: string) {
    return this.adminService.reconcileTransaction(paymentId);
  }

  // Permet au SuperAdmin de voir le journal de bord d'un tenant spécifique
  @Get('audit/journal')
  getTenantJournal(
    @Query('tenantId') tenantId: string,
    @Query('action') action?: string,
    @Query('severite') severite?: AuditSeverite,
    @Query('limit') limit?: string,
  ) {
    if (!tenantId) {
      return [];
    }
    return this.auditService.getJournalPatron(tenantId, {
      action,
      severite,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }
}