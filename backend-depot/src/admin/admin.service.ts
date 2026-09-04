import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CampayService } from '../payments/campay.service';
import { StripePaymentsService } from '../payments/stripe.service';
import { PaymentsService } from '../payments/payments.service';
import {
  PaymentStatus,
  PaymentMethod,
  TenantStatus,
  Prisma,
} from '@prisma/client';

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  nom: true,
  telephone: true,
  adresse: true,
  avatar: true,
  twoFAEnabled: true,
  tenantId: true,
  depotId: true,
  isSuperAdmin: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  tenant: {
    select: {
      id: true,
      name: true,
      metier: true,
      status: true,
    },
  },
  depot: {
    select: {
      id: true,
      nom: true,
    },
  },
  _count: {
    select: {
      ventesCreees: true,
      tourneesOuvertes: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campayService: CampayService,
    private readonly stripeService: StripePaymentsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      gracePeriodTenants,
      expiredTenants,
      totalUsers,
      totalDepots,
      pendingTransactions,
      successTransactions,
      failedTransactions,
      blockedTransactions,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.TRIAL } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.GRACE_PERIOD } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.EXPIRED } }),
      this.prisma.user.count(),
      this.prisma.depot.count({ where: { isArchived: false } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.getStalePendingCount(),
    ]);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      gracePeriodTenants,
      expiredTenants,
      totalUsers,
      totalDepots,
      pendingTransactions,
      successTransactions,
      failedTransactions,
      blockedTransactions,
    };
  }

  async getRevenueMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await this.prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    });
    const mrr = result._sum.totalAmount ?? 0;
    return { mrr, arr: mrr * 12, currency: 'FCFA' };
  }

  async getUsersByMetier() {
    const tenants = await this.prisma.tenant.findMany({
      select: { metier: true, _count: { select: { users: true } } },
    });
    const metierCounts: Record<string, number> = {};
    for (const t of tenants) {
      const metier = t.metier ?? 'Inconnu';
      metierCounts[metier] = (metierCounts[metier] || 0) + t._count.users;
    }
    return Object.entries(metierCounts).map(([metier, count]) => ({ metier, count }));
  }

  async getSubscribersByPlan() {
    const results = await this.prisma.tenant.groupBy({
      by: ['planType'],
      _count: { _all: true },
    });
    return results.map((r) => ({ plan: r.planType, count: r._count._all }));
  }

  async getTransactions(filters: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.PaymentWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.method) where.method = filters.method;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { tenant: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.payment.count({ where }),
    ]);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const transactions = payments.map((payment) => ({
      id: payment.id,
      tenantId: payment.tenantId,
      tenantName: (payment.tenant as { name: string } | null)?.name ?? '—',
      amount: payment.amount,
      tvaAmount: payment.tvaAmount,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      planPurchased: payment.planPurchased,
      billingCycle: payment.billingCycle,
      operatorTxId: payment.operatorTxId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      isStale: payment.status === PaymentStatus.PENDING && payment.createdAt < twentyFourHoursAgo,
    }));
    return { transactions, total };
  }

  async getTenants(filters: {
    status?: TenantStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.TenantWhereInput = {};
    if (filters.status) where.status = filters.status;
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: { _count: { select: { users: true, depots: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.tenant.count({ where }),
    ]);
    const now = new Date();
    const tenantDtos = tenants.map((tenant) => {
      const daysUntilExpiry = tenant.subscriptionEnd
        ? Math.ceil((tenant.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        maxDepots: tenant.maxDepots,
        subscriptionEnd: tenant.subscriptionEnd,
        lastPaymentId: tenant.lastPaymentId,
        userCount: tenant._count.users,
        depotCount: tenant._count.depots,
        daysUntilExpiry,
      };
    });
    return { tenants: tenantDtos, total };
  }

  async reconcileTransaction(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { success: false, message: 'Paiement introuvable.' };
    if (payment.status !== PaymentStatus.PENDING) {
      return { success: false, message: `Statut actuel: ${payment.status}. Reconciliation impossible.`, newStatus: payment.status };
    }
    try {
      if (payment.method === PaymentMethod.MTN_MOMO && payment.operatorTxId) {
        const status = await this.campayService.getTransactionStatus(payment.operatorTxId);
        if (status.status === 'SUCCESSFUL' || status.status === 'SUCCESS') {
          await this.paymentsService.markPaymentSuccess(payment.id, payment.operatorTxId);
          return { success: true, message: 'Paiement confirme via Campay.', newStatus: PaymentStatus.SUCCESS };
        }
        if (status.status === 'FAILED') {
          await this.paymentsService.markPaymentFailed(payment.id);
          return { success: true, message: 'Paiement marque comme echoue.', newStatus: PaymentStatus.FAILED };
        }
      }
      if (
        (payment.method === PaymentMethod.VISA_CARD || payment.method === PaymentMethod.MASTERCARD) &&
        payment.stripePaymentIntentId
      ) {
        const paymentIntent = await this.stripeService.retrievePaymentIntent(payment.stripePaymentIntentId);
        if (paymentIntent.status === 'succeeded') {
          await this.paymentsService.markPaymentSuccess(payment.id, paymentIntent.id);
          return { success: true, message: 'Paiement confirme via Stripe.', newStatus: PaymentStatus.SUCCESS };
        }
        if (paymentIntent.status === 'canceled') {
          await this.paymentsService.markPaymentFailed(payment.id);
          return { success: true, message: 'Paiement marque comme annule.', newStatus: PaymentStatus.FAILED };
        }
      }
      return { success: false, message: 'Statut toujours PENDING chez le provider.' };
    } catch (error) {
      return { success: false, message: `Erreur de reconciliation: ${error instanceof Error ? error.message : 'Inconnue'}` };
    }
  }

  private async getStalePendingCount(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.payment.count({ where: { status: PaymentStatus.PENDING, createdAt: { lt: twentyFourHoursAgo } } });
  }

  async getAllUsers(filters: {
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.UserWhereInput = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.role) where.role = filters.role as any;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: ADMIN_USER_SELECT });
    if (!user) throw new Error('Utilisateur introuvable');
    return user;
  }

  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur introuvable');
    if (user.isSuperAdmin && user.isActive) {
      const otherSuperAdmins = await this.prisma.user.count({ where: { isSuperAdmin: true, isActive: true, id: { not: userId } } });
      if (otherSuperAdmins === 0) throw new Error('Impossible de désactiver le dernier super admin actif');
    }
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive }, select: ADMIN_USER_SELECT });
    return { success: true, user: updated, message: `Utilisateur ${updated.isActive ? 'activé' : 'désactivé'}` };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur introuvable');
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { role: role as any }, select: ADMIN_USER_SELECT });
    return { success: true, user: updated, message: `Rôle mis à jour: ${role}` };
  }

  async toggleSuperAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur introuvable');
    if (user.isSuperAdmin) {
      const otherSuperAdmins = await this.prisma.user.count({ where: { isSuperAdmin: true, id: { not: userId } } });
      if (otherSuperAdmins === 0) throw new Error('Impossible de retirer le statut super admin du dernier super admin');
    }
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { isSuperAdmin: !user.isSuperAdmin }, select: ADMIN_USER_SELECT });
    return { success: true, user: updated, message: `Statut SuperAdmin ${updated.isSuperAdmin ? 'accordé' : 'retiré'}` };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur introuvable');
    if (user.isSuperAdmin) {
      const otherSuperAdmins = await this.prisma.user.count({ where: { isSuperAdmin: true, id: { not: userId } } });
      if (otherSuperAdmins === 0) throw new Error('Impossible de supprimer le dernier super admin');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true, message: 'Utilisateur supprimé' };
  }

  async getAnalyticsOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const [currentMonthRevenue, lastMonthRevenue, activeTenants, totalTenants, activeUsers, totalUsers, totalDepots, totalVentes, totalArticles] = await Promise.all([
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCESS, createdAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCESS, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { totalAmount: true } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.depot.count({ where: { isArchived: false } }),
      this.prisma.vente.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.article.count(),
    ]);
    const currentMRR = currentMonthRevenue._sum.totalAmount ?? 0;
    const lastMRR = lastMonthRevenue._sum.totalAmount ?? 0;
    const mrrGrowth = lastMRR > 0 ? ((currentMRR - lastMRR) / lastMRR) * 100 : 0;
    return {
      revenue: { currentMonth: currentMRR, lastMonth: lastMRR, growth: mrrGrowth, arr: currentMRR * 12 },
      tenants: { active: activeTenants, total: totalTenants, activationRate: totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0 },
      users: { active: activeUsers, total: totalUsers, activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0 },
      platform: { totalDepots, totalVentes, totalArticles },
    };
  }

  async getUsageMetrics(period: string = '30d') {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const [ventesCount, articlesCreated, usersActive, depotsActive] = await Promise.all([
      this.prisma.vente.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.article.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.user.count({ where: { isActive: true, updatedAt: { gte: startDate } } }),
      this.prisma.depot.count({ where: { isArchived: false, updatedAt: { gte: startDate } } }),
    ]);
    return { period, ventes: ventesCount, articlesCreated, activeUsers: usersActive, activeDepots: depotsActive };
  }

  async getRevenueAnalytics(period: string = '30d') {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const payments = await this.prisma.payment.findMany({ where: { status: PaymentStatus.SUCCESS, createdAt: { gte: startDate } }, orderBy: { createdAt: 'asc' } });
    const revenueByMethod = payments.reduce((acc, payment) => {
      const method = payment.method;
      acc[method] = (acc[method] || 0) + (payment.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);
    const revenueByPlan = await this.prisma.tenant.groupBy({ by: ['planType'], _count: { _all: true }, where: { status: TenantStatus.ACTIVE } });
    const dailyRevenue = payments.reduce((acc, payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (payment.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);
    return {
      period,
      totalRevenue: payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      revenueByMethod,
      revenueByPlan: revenueByPlan.map(r => ({ plan: r.planType, count: r._count._all })),
      dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })),
    };
  }

  async getChurnAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const [expiredLast30Days, expiredLast90Days, activeNow, active30DaysAgo] = await Promise.all([
      this.prisma.tenant.count({ where: { status: TenantStatus.EXPIRED, updatedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.EXPIRED, updatedAt: { gte: ninetyDaysAgo } } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE, createdAt: { lte: thirtyDaysAgo } } }),
    ]);
    const churnRate30d = active30DaysAgo > 0 ? (expiredLast30Days / active30DaysAgo) * 100 : 0;
    const churnRate90d = activeNow > 0 ? (expiredLast90Days / activeNow) * 100 : 0;
    return { churnRate30d, churnRate90d, expiredLast30Days, expiredLast90Days, activeNow };
  }

  async getFeatureUsage() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [ventesCount, stockMovements, caisseSessions, commandesFournisseur, tournees] = await Promise.all([
      this.prisma.vente.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.mouvementStock.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.sessionCaisse.count({ where: { dateOuverture: { gte: thirtyDaysAgo } } }),
      this.prisma.commandeFournisseur.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.tournee.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);
    const totalActions = ventesCount + stockMovements + caisseSessions + commandesFournisseur + tournees;
    return {
      period: '30d',
      features: [
        { name: 'Ventes', count: ventesCount, percentage: totalActions > 0 ? (ventesCount / totalActions) * 100 : 0 },
        { name: 'Mouvements Stock', count: stockMovements, percentage: totalActions > 0 ? (stockMovements / totalActions) * 100 : 0 },
        { name: 'Sessions Caisse', count: caisseSessions, percentage: totalActions > 0 ? (caisseSessions / totalActions) * 100 : 0 },
        { name: 'Commandes Fournisseur', count: commandesFournisseur, percentage: totalActions > 0 ? (commandesFournisseur / totalActions) * 100 : 0 },
        { name: 'Tournées', count: tournees, percentage: totalActions > 0 ? (tournees / totalActions) * 100 : 0 },
      ],
      totalActions,
    };
  }
}
