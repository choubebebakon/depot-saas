import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod, TenantStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Controleur Admin pour le dashboard interne.
 * Acces restreint au proprietaire (role ADMIN sur tenant system).
 *
 * Routes disponibles:
 * - GET /api/v1/admin/stats : Statistiques globales
 * - GET /api/v1/admin/transactions : Liste des transactions filtree
 * - GET /api/v1/admin/tenants : Liste des tenants par statut
 * - POST /api/v1/admin/transactions/:id/reconcile : Reconciliation manuelle
 */
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Recupere les statistiques globales pour le dashboard admin.
   *
   * Statistiques:
   * - totalTenants, activeTenants, gracePeriodTenants, expiredTenants
   * - pendingTransactions, successTransactions, failedTransactions
   * - blockedTransactions (> 24h PENDING)
   */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques admin globales' })
  @ApiResponse({ status: 200, description: 'Statistiques retournees' })
  @ApiResponse({ status: 403, description: 'Acces refuse' })
  async getStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReturnType<AdminService['getStats']>> {
    return this.adminService.getStats(user.userId, user.tenantId);
  }

  /**
   * Recupere la liste des transactions avec filtres.
   *
   * Filtres disponibles:
   * - status: PENDING | SUCCESS | FAILED
   * - method: MTN_MOMO | VISA_CARD | MASTERCARD
   * - limit, offset: pagination
   *
   * Chaque transaction inclut isStale (> 24h PENDING) pour les alertes.
   */
  @Get('transactions')
  @ApiOperation({ summary: 'Liste des transactions avec filtres' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PaymentStatus,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    enum: PaymentMethod,
    description: 'Filtrer par methode',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre max de resultats',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset pour pagination',
  })
  @ApiResponse({ status: 200, description: 'Liste des transactions' })
  @ApiResponse({ status: 403, description: 'Acces refuse' })
  async getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ReturnType<AdminService['getTransactions']>> {
    return this.adminService.getTransactions(user.userId, user.tenantId, {
      status,
      method,
      limit: limit ? parseInt(limit as unknown as string, 10) : undefined,
      offset: offset ? parseInt(offset as unknown as string, 10) : undefined,
    });
  }

  /**
   * Recupere la liste des tenants avec leur statut.
   *
   * Filtres disponibles:
   * - status: ACTIVE | GRACE_PERIOD | EXPIRED
   * - limit, offset: pagination
   *
   * Chaque tenant inclut daysUntilExpiry et counts (users, depots).
   */
  @Get('tenants')
  @ApiOperation({ summary: 'Liste des tenants avec statuts' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TenantStatus,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre max de resultats',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset pour pagination',
  })
  @ApiResponse({ status: 200, description: 'Liste des tenants' })
  @ApiResponse({ status: 403, description: 'Acces refuse' })
  async getTenants(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: TenantStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ReturnType<AdminService['getTenants']>> {
    return this.adminService.getTenants(user.userId, user.tenantId, {
      status,
      limit: limit ? parseInt(limit as unknown as string, 10) : undefined,
      offset: offset ? parseInt(offset as unknown as string, 10) : undefined,
    });
  }

  /**
   * Reconciliation manuelle d'une transaction.
   * Verifie le statut reel aupres du provider (Campay ou Stripe) et met a jour.
   *
   * Reponse:
   * - success: true/false
   * - message: description du resultat
   * - newStatus: nouveau statut si modifie
   */
  @Post('transactions/:id/reconcile')
  @ApiOperation({ summary: "Reconciliation manuelle d'une transaction" })
  @ApiResponse({ status: 200, description: 'Reconciliation effectuee' })
  @ApiResponse({ status: 403, description: 'Acces refuse' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  async reconcileTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') paymentId: string,
  ): Promise<ReturnType<AdminService['reconcileTransaction']>> {
    return this.adminService.reconcileTransaction(
      user.userId,
      user.tenantId,
      paymentId,
    );
  }
}
