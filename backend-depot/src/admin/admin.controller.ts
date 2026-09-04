import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  PaymentStatus,
  PaymentMethod,
  TenantStatus,
  AuditSeverite,
  Role,
} from '@prisma/client';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';

const MAX_PAGE_SIZE = 100;
const MAX_PAGE_OFFSET = 100_000;
const MAX_AUDIT_PAGE_SIZE = 500;
const ALLOWED_ANALYTICS_PERIODS = new Set(['7d', '30d', '90d', '1y']);

@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  private parsePageValue(value: string | undefined, name: string, max: number, fallback: number): number {
    if (value === undefined || value === '') return fallback;
    if (!/^\d+$/.test(value)) throw new BadRequestException(`${name} doit être un entier positif.`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > max) {
      throw new BadRequestException(`${name} est hors limites.`);
    }
    return parsed;
  }

  private parseEnum<T extends string>(value: string | undefined, values: readonly T[], name: string): T | undefined {
    if (value === undefined || value === '') return undefined;
    if (!values.includes(value as T)) throw new BadRequestException(`${name} invalide.`);
    return value as T;
  }

  private parseBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined || value === '') return undefined;
    if (value !== 'true' && value !== 'false') throw new BadRequestException('isActive doit être true ou false.');
    return value === 'true';
  }

  private parsePeriod(value: string | undefined): string | undefined {
    if (value === undefined || value === '') return undefined;
    if (!ALLOWED_ANALYTICS_PERIODS.has(value)) throw new BadRequestException('Période analytics invalide.');
    return value;
  }

  private parseRole(value: string | undefined): Role | undefined {
    return this.parseEnum(value, Object.values(Role), 'role');
  }

  private parseText(value: string | undefined, name: string, maxLength: number): string | undefined {
    if (value === undefined) return undefined;
    const normalized = value.trim();
    if (!normalized) return undefined;
    if (normalized.length > maxLength) throw new BadRequestException(`${name} est trop long.`);
    return normalized;
  }

  private ensureNotSelf(targetUserId: string, req: any): void {
    if (req.user?.userId === targetUserId) {
      throw new BadRequestException('Un SuperAdmin ne peut pas modifier ou supprimer son propre compte depuis cet espace.');
    }
  }

  @Get('stats') getPlatformStats() { return this.adminService.getPlatformStats(); }
  @Get('metrics') getRevenueMetrics() { return this.adminService.getRevenueMetrics(); }
  @Get('users-by-metier') getUsersByMetier() { return this.adminService.getUsersByMetier(); }
  @Get('subscribers-by-plan') getSubscribersByPlan() { return this.adminService.getSubscribersByPlan(); }

  @Get('transactions')
  getTransactions(@Query('status') status?: string, @Query('method') method?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.adminService.getTransactions({
      status: this.parseEnum(status, Object.values(PaymentStatus), 'status'),
      method: this.parseEnum(method, Object.values(PaymentMethod), 'method'),
      limit: this.parsePageValue(limit, 'limit', MAX_PAGE_SIZE, 50),
      offset: this.parsePageValue(offset, 'offset', MAX_PAGE_OFFSET, 0),
    });
  }

  @Get('tenants')
  getTenants(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.adminService.getTenants({
      status: this.parseEnum(status, Object.values(TenantStatus), 'status'),
      limit: this.parsePageValue(limit, 'limit', MAX_PAGE_SIZE, 50),
      offset: this.parsePageValue(offset, 'offset', MAX_PAGE_OFFSET, 0),
    });
  }

  @Post('transactions/:id/reconcile')
  reconcileTransaction(@Param('id') paymentId: string) {
    const id = this.parseText(paymentId, 'paymentId', 200);
    if (!id) throw new BadRequestException('Identifiant de paiement manquant.');
    return this.adminService.reconcileTransaction(id);
  }

  @Get('audit/journal')
  getTenantJournal(@Query('tenantId') tenantId?: string, @Query('action') action?: string, @Query('severite') severite?: string, @Query('limit') limit?: string) {
    const safeTenantId = this.parseText(tenantId, 'tenantId', 100);
    if (!safeTenantId) throw new BadRequestException('tenantId est obligatoire.');
    return this.auditService.getJournalPatron(safeTenantId, {
      action: this.parseText(action, 'action', 100),
      severite: this.parseEnum(severite, Object.values(AuditSeverite), 'severite'),
      limit: this.parsePageValue(limit, 'limit', MAX_AUDIT_PAGE_SIZE, 100),
    });
  }

  @Get('users')
  getAllUsers(@Query('tenantId') tenantId?: string, @Query('role') role?: string, @Query('isActive') isActive?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.adminService.getAllUsers({
      tenantId: this.parseText(tenantId, 'tenantId', 100),
      role: this.parseRole(role),
      isActive: this.parseBoolean(isActive),
      limit: this.parsePageValue(limit, 'limit', MAX_PAGE_SIZE, 50),
      offset: this.parsePageValue(offset, 'offset', MAX_PAGE_OFFSET, 0),
    });
  }

  @Get('users/:id')
  getUserById(@Param('id') userId: string) {
    const id = this.parseText(userId, 'userId', 200);
    if (!id) throw new BadRequestException('Identifiant utilisateur manquant.');
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/toggle-active')
  toggleUserActive(@Param('id') userId: string, @Req() req: any) {
    const id = this.parseText(userId, 'userId', 200);
    if (!id) throw new BadRequestException('Identifiant utilisateur manquant.');
    this.ensureNotSelf(id, req);
    return this.adminService.toggleUserActive(id);
  }

  @Post('users/:id/role')
  updateUserRole(@Param('id') userId: string, @Body('role') role: string, @Req() req: any) {
    const id = this.parseText(userId, 'userId', 200);
    if (!id) throw new BadRequestException('Identifiant utilisateur manquant.');
    this.ensureNotSelf(id, req);
    const safeRole = this.parseRole(role);
    if (!safeRole) throw new BadRequestException('role est obligatoire.');
    return this.adminService.updateUserRole(id, safeRole);
  }

  @Post('users/:id/super-admin')
  toggleSuperAdmin(@Param('id') userId: string, @Req() req: any) {
    const id = this.parseText(userId, 'userId', 200);
    if (!id) throw new BadRequestException('Identifiant utilisateur manquant.');
    this.ensureNotSelf(id, req);
    return this.adminService.toggleSuperAdmin(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string, @Req() req: any) {
    const id = this.parseText(userId, 'userId', 200);
    if (!id) throw new BadRequestException('Identifiant utilisateur manquant.');
    this.ensureNotSelf(id, req);
    return this.adminService.deleteUser(id);
  }

  @Get('analytics/overview') getAnalyticsOverview() { return this.adminService.getAnalyticsOverview(); }

  @Get('analytics/usage')
  getUsageMetrics(@Query('period') period?: string) { return this.adminService.getUsageMetrics(this.parsePeriod(period)); }

  @Get('analytics/revenue')
  getRevenueAnalytics(@Query('period') period?: string) { return this.adminService.getRevenueAnalytics(this.parsePeriod(period)); }

  @Get('analytics/churn') getChurnAnalytics() { return this.adminService.getChurnAnalytics(); }
  @Get('analytics/feature-usage') getFeatureUsage() { return this.adminService.getFeatureUsage(); }
}
