import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { AuditSeverite } from '@prisma/client';

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

  // Permet au SuperAdmin de voir le journal de bord d'un tenant spécifique
  @Get('audit/journal')
  getTenantJournal(
    @Query('tenantId') tenantId: string,
    @Query('action') action?: string,
    @Query('severite') severite?: AuditSeverite,
    @Query('limit') limit?: string,
  ) {
    // Si tenantId n'est pas fourni, le SuperAdminGuard ne bloque pas mais il faut le tenantId
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
