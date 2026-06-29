import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  PaymentStatus,
  PaymentMethod,
  TenantStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CampayService } from '../payments/campay.service';
import { StripePaymentsService } from '../payments/stripe.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * DTO pour les statistiques admin.
 */
interface AdminStatsDto {
  totalTenants: number;
  activeTenants: number;
  gracePeriodTenants: number;
  expiredTenants: number;
  pendingTransactions: number;
  successTransactions: number;
  failedTransactions: number;
  blockedTransactions: number; // > 24h PENDING
}

/**
 * DTO pour une transaction admin.
 */
interface AdminTransactionDto {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  tvaAmount: number;
  totalAmount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  planPurchased: string | null;
  billingCycle: string | null;
  operatorTxId: string | null;
  stripePaymentIntentId: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isStale: boolean; // > 24h PENDING
}

/**
 * DTO pour un tenant admin.
 */
interface AdminTenantDto {
  id: string;
  name: string | null;
  plan: string | null;
  status: TenantStatus;
  maxDepots: number;
  subscriptionEnd: Date | null;
  lastPaymentId: string | null;
  userCount: number;
  depotCount: number;
  daysUntilExpiry: number;
}

/**
 * Service Admin pour le dashboard interne.
 * Acces restreint au proprietaire.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campayService: CampayService,
    private readonly stripeService: StripePaymentsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Verifie que l'utilisateur est le proprietaire (ADMIN sur tenant system).
   * TODO: Implementer verification proprietaire via role special ou tenantId systeme.
   */
  private assertIsOwner(userId: string, tenantId: string): void {
    // Pour l'instant, verifier que c'est un ADMIN
    // A implementer: verification que c'est le proprietaire de la plateforme
    if (tenantId !== 'system') {
      throw new ForbiddenException({
        error: 'ADMIN_ACCESS_DENIED',
        message: 'Acces reserve au proprietaire.',
      });
    }
  }

  /**
   * Recupere les statistiques globales pour le dashboard admin.
   */
  async getStats(userId: string, tenantId: string): Promise<AdminStatsDto> {
    this.assertIsOwner(userId, tenantId);

    const [
      totalTenants,
      activeTenants,
      gracePeriodTenants,
      expiredTenants,
      pendingTransactions,
      successTransactions,
      failedTransactions,
      blockedTransactions,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({
        where: { status: TenantStatus.GRACE_PERIOD },
      }),
      this.prisma.tenant.count({ where: { status: TenantStatus.EXPIRED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.getStalePendingCount(),
    ]);

    return {
      totalTenants,
      activeTenants,
      gracePeriodTenants,
      expiredTenants,
      pendingTransactions,
      successTransactions,
      failedTransactions,
      blockedTransactions,
    };
  }

  /**
   * Recupere la liste des transactions avec filtres.
   */
  async getTransactions(
    userId: string,
    tenantId: string,
    filters: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ transactions: AdminTransactionDto[]; total: number }> {
    this.assertIsOwner(userId, tenantId);

    const where: Prisma.PaymentWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.method) {
      where.method = filters.method;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          tenant: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.payment.count({ where }),
    ]);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const transactions: AdminTransactionDto[] = payments.map((payment) => ({
      id: payment.id,
      tenantId: payment.tenantId,
      tenantName: (payment.tenant as { name: string }).name,
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
   * Recupere la liste des tenants avec leur statut.
   */
  async getTenants(
    userId: string,
    tenantId: string,
    filters: {
      status?: TenantStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ tenants: AdminTenantDto[]; total: number }> {
    this.assertIsOwner(userId, tenantId);

    const where: Prisma.TenantWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: { users: true, depots: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const now = new Date();

    const tenantDtos: AdminTenantDto[] = tenants.map((tenant) => {
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
        userCount: (tenant as unknown as { _count: { users: number } })._count
          .users,
        depotCount: (tenant as unknown as { _count: { depots: number } })._count
          .depots,
        daysUntilExpiry,
      };
    });

    return { tenants: tenantDtos, total };
  }

  /**
   * Reconciliation manuelle d'une transaction.
   * Verifie le statut reel aupres du provider et met a jour si necessaire.
   */
  async reconcileTransaction(
    userId: string,
    tenantId: string,
    paymentId: string,
  ): Promise<{ success: boolean; message: string; newStatus?: PaymentStatus }> {
    this.assertIsOwner(userId, tenantId);

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

  /**
   * Compte les transactions PENDING depuis plus de 24h.
   */
  private async getStalePendingCount(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.payment.count({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });
  }
}
