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

  // === GESTION DES UTILISATEURS ===

  @Get('users')
  getAllUsers(
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAllUsers({
      tenantId,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('users/:id')
  getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users/:id/toggle-active')
  toggleUserActive(@Param('id') userId: string) {
    return this.adminService.toggleUserActive(userId);
  }

  @Post('users/:id/role')
  updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Post('users/:id/super-admin')
  toggleSuperAdmin(@Param('id') userId: string) {
    return this.adminService.toggleSuperAdmin(userId);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  // === ANALYTICS AVANCÉS ===

  @Get('analytics/overview')
  getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/usage')
  getUsageMetrics(
    @Query('period') period?: string,
  ) {
    return this.adminService.getUsageMetrics(period);
  }

  @Get('analytics/revenue')
  getRevenueAnalytics(
    @Query('period') period?: string,
  ) {
    return this.adminService.getRevenueAnalytics(period);
  }

  @Get('analytics/churn')
  getChurnAnalytics() {
    return this.adminService.getChurnAnalytics();
  }

  @Get('analytics/feature-usage')
  getFeatureUsage() {
    return this.adminService.getFeatureUsage();
  }
}