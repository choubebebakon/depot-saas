import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Statistiques globales du SaaS pour le dashboard SuperAdmin
   */
  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      totalUsers,
      totalDepots,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({
        where: {
          payments: {
            some: {
              status: PaymentStatus.SUCCESS,
            },
          },
        },
      }),
      this.prisma.tenant.count({
        where: {
          payments: {
            none: {},
          },
        },
      }),
      this.prisma.user.count(),
      this.prisma.depot.count({ where: { isArchived: false } }),
    ]);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      totalUsers,
      totalDepots,
    };
  }

  /**
   * Métriques financières agrégées
   */
  async getRevenueMetrics() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const mrr = result._sum.amount ?? 0;

    return {
      mrr,
      currency: 'FCFA',
    };
  }

  /**
   * Ventilation des utilisateurs par métier
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
   * Ventilation des abonnements par plan
   */
  async getSubscribersByPlan() {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        plan: true,
      },
      where: {
        payments: {
          some: {
            status: PaymentStatus.SUCCESS,
          },
        },
      },
    });

    const planCounts: Record<string, number> = {};
    for (const t of tenants) {
      const plan = t.plan ?? 'FREE';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    }

    return Object.entries(planCounts).map(([plan, count]) => ({
      plan,
      count,
    }));
  }
}
