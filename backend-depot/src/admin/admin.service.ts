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

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campayService: CampayService,
    private readonly stripeService: StripePaymentsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Statistiques globales du SaaS pour le dashboard SuperAdmin.
   * IMPORTANT : basé sur Tenant.status (source de vérité de l'abonnement),
   * pas sur l'historique des paiements — un tenant EXPIRED qui a payé une
   * fois il y a 6 mois ne doit pas compter comme "actif".
   */
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
      this.prisma.tenant.count({
        where: { status: TenantStatus.GRACE_PERIOD },
      }),
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

  /**
   * Métriques financières agrégées (MRR basé sur totalAmount, qui inclut
   * la TVA — c'est le montant réellement encaissé, contrairement à
   * `amount` qui est hors taxe).
   */
  async getRevenueMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    });

    const mrr = result._sum.totalAmount ?? 0;

    return {
      mrr,
      arr: mrr * 12,
      currency: 'FCFA',
    };
  }

  /**
   * Ventilation des utilisateurs par métier.
   */
  async getUsersByMetier() {
    const tenants = await this.prisma.tenant.findMany({
      select: { metier: true, _count: { select: { users: true } } },
    });

    const metierCounts: Record<string, number> = {};
    for (const t of tenants) {
      const metier = t.metier ?? 'Inconnu';
      metierCounts[metier] = (metierCounts[metier] || 0) + t._count.users;
    }

    return Object.entries(metierCounts).map(([metier, count]) => ({
      metier,
      count,
    }));
  }

  /**
   * Ventilation des abonnements par plan — basé sur Tenant.planType
   * (l'enum), pas sur l'historique de paiement, pour inclure aussi les
   * tenants en TRIAL sans paiement.
   */
  async getSubscribersByPlan() {
    const results = await this.prisma.tenant.groupBy({
      by: ['planType'],
      _count: { _all: true },
    });

    return results.map((r) => ({
      plan: r.planType,
      count: r._count._all,
    }));
  }

  /**
   * Liste des transactions avec filtres (restaurée).
   */
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
      isStale:
        payment.status === PaymentStatus.PENDING &&
        payment.createdAt < twentyFourHoursAgo,
    }));

    return { transactions, total };
  }

  /**
   * Liste des tenants avec statut et compteurs (restaurée).
   */
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
        ? Math.ceil(
            (tenant.subscriptionEnd.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
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

  /**
   * Réconciliation manuelle d'une transaction restée PENDING (restaurée).
   */
  async reconcileTransaction(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return { success: false, message: 'Paiement introuvable.' };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return {
        success: false,
        message: `Statut actuel: ${payment.status}. Reconciliation impossible.`,
        newStatus: payment.status,
      };
    }

    try {
      if (payment.method === PaymentMethod.MTN_MOMO && payment.operatorTxId) {
        const status = await this.campayService.getTransactionStatus(
          payment.operatorTxId,
        );

        if (status.status === 'SUCCESSFUL' || status.status === 'SUCCESS') {
          await this.paymentsService.markPaymentSuccess(
            payment.id,
            payment.operatorTxId,
          );
          return {
            success: true,
            message: 'Paiement confirme via Campay.',
            newStatus: PaymentStatus.SUCCESS,
          };
        } else if (status.status === 'FAILED') {
          await this.paymentsService.markPaymentFailed(payment.id);
          return {
            success: true,
            message: 'Paiement marque comme echoue.',
            newStatus: PaymentStatus.FAILED,
          };
        }
      }

      if (
        (payment.method === PaymentMethod.VISA_CARD ||
          payment.method === PaymentMethod.MASTERCARD) &&
        payment.stripePaymentIntentId
      ) {
        const paymentIntent = await this.stripeService.retrievePaymentIntent(
          payment.stripePaymentIntentId,
        );

        if (paymentIntent.status === 'succeeded') {
          await this.paymentsService.markPaymentSuccess(
            payment.id,
            paymentIntent.id,
          );
          return {
            success: true,
            message: 'Paiement confirme via Stripe.',
            newStatus: PaymentStatus.SUCCESS,
          };
        } else if (paymentIntent.status === 'canceled') {
          await this.paymentsService.markPaymentFailed(payment.id);
          return {
            success: true,
            message: 'Paiement marque comme annule.',
            newStatus: PaymentStatus.FAILED,
          };
        }
      }

      return {
        success: false,
        message: 'Statut toujours PENDING chez le provider.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur de reconciliation: ${error instanceof Error ? error.message : 'Inconnue'}`,
      };
    }
  }

  private async getStalePendingCount(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.payment.count({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: twentyFourHoursAgo },
      },
    });
  }
}