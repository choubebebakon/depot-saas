import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

interface ChurnResult {
  rate: number | null;
  insufficientData: boolean;
}

export interface MetricsResult {
  mrr: number;
  arr: number;
  churnRate: number | null;
  churnInsufficientData: boolean;
  arpu: number | null;
  ltv: number | null;
  evolution: Array<{ month: string; mrr: number }>;
  sectorStats: Array<{ name: string; status: string; count: number }>;
}

@Injectable()
export class PlatformAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Cron exécuté tous les jours à 04h00 du matin
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async calculateMetrics() {
    // 1) MRR : normalise annuel -> mensuel
    const subs = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'GRACE'] } },
    });

    const totalMrr = subs.reduce((acc, sub) => {
      if (!sub.plan) return acc;
      const plan = sub.plan as { billingCycle?: string; priceAmount?: number };
      const monthly =
        plan.billingCycle === 'ANNUEL'
          ? (plan.priceAmount ?? 0) / 12
          : (plan.priceAmount ?? 0);
      return acc + monthly;
    }, 0);

    // 2) Parcs tenants (via subscription.status)
    const activeTenants = await this.prisma.subscription.count({
      where: { status: { in: ['TRIALING', 'ACTIVE', 'GRACE'] } },
    });

    const trialTenants = await this.prisma.subscription.count({
      where: { status: 'TRIALING' },
    });

    const suspendedTenants = await this.prisma.subscription.count({
      where: { status: { in: ['EXPIRED', 'READ_ONLY', 'CANCELED'] } },
    });

    await this.prisma.platformMetricSnapshot.create({
      data: {
        data: {},
        totalMrr,
        activeTenants,
        trialTenants,
        suspendedTenants,
      },
    });
  }

  async getLatestStats() {
    return this.prisma.platformMetricSnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calcule le churn rate réel basé sur les changements de statut des subscriptions
   * Churn = (subscriptions passées à CANCELLED/EXPIRED ce mois) / (subscriptions actives en début de mois)
   * Retourne null si données insuffisantes (< 30 jours d'historique)
   */
  private async calculateChurnRate(): Promise<ChurnResult> {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Vérifier si on a assez d'historique (au moins un snapshot datant de > 30 jours)
    const oldestSnapshot = await this.prisma.platformMetricSnapshot.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!oldestSnapshot) {
      return { rate: null, insufficientData: true };
    }

    const daysSinceFirstSnapshot = Math.floor(
      (now.getTime() - oldestSnapshot.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceFirstSnapshot < 30) {
      return { rate: null, insufficientData: true };
    }

    // Compter les subscriptions qui sont passées à CANCELLED ou EXPIRED dans les 30 derniers jours
    // Note: Comme le modèle Subscription n'a pas de champ updatedAt, on utilise une approximation
    // basée sur les paiements. Si une subscription a un paiement récent mais est maintenant CANCELLED/EXPIRED,
    // on considère qu'elle a churné récemment.
    
    const cancelledOrExpiredSubs = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['CANCELED', 'EXPIRED'] },
      },
    });

    // Filtrer celles qui ont eu une activité récente (paiement dans les 30 derniers jours avant d'être annulées)
    // C'est une approximation car on n'a pas l'historique des changements de statut
    const recentlyChurned = cancelledOrExpiredSubs.filter(sub => {
      const payments = sub.payments as Array<{ createdAt: Date }> | null;
      if (!payments || payments.length === 0) return false;
      const lastPayment = payments[payments.length - 1];
      // Si le dernier paiement date de moins de 60 jours, on considère que le churn est récent
      const daysSinceLastPayment = Math.floor(
        (now.getTime() - lastPayment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastPayment <= 60;
    });

    const churnedCount = recentlyChurned.length;

    // Nombre de subscriptions actives au début du mois (il y a 30 jours)
    // On utilise le snapshot d'il y a 30 jours si disponible
    const snapshot30DaysAgo = await this.prisma.platformMetricSnapshot.findFirst({
      where: {
        createdAt: {
          lte: thirtyDaysAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeAtStartOfMonth = snapshot30DaysAgo?.activeTenants || 0;

    if (activeAtStartOfMonth === 0) {
      return { rate: null, insufficientData: true };
    }

    const churnRate = (churnedCount / activeAtStartOfMonth) * 100;

    return { rate: churnRate, insufficientData: false };
  }

  async getMetrics(): Promise<MetricsResult> {
    // 1) Current Status - MRR
    const subs = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'GRACE'] } },
    });

    let currentMrr = 0;
    for (const sub of subs) {
      if (sub.plan) {
        const plan = sub.plan as { billingCycle?: string; priceAmount?: number };
        currentMrr += plan.billingCycle === 'ANNUEL' ? (plan.priceAmount ?? 0) / 12 : (plan.priceAmount ?? 0);
      }
    }

    const arr = currentMrr * 12;

    // ARPU: Average Revenue Per User (tenant actif payant)
    const activeTenantsCount = subs.length;
    const arpu = activeTenantsCount > 0 ? currentMrr / activeTenantsCount : null;

    // 2) Churn rate réel
    const churnResult = await this.calculateChurnRate();
    const ltv = churnResult.rate !== null && churnResult.rate > 0 && arpu !== null
      ? arpu / (churnResult.rate / 100)
      : null;

    // 3) Tenants par secteur
    const tenants = await this.prisma.tenant.groupBy({
      by: ['metier', 'subscriptionStatus'],
      _count: {
        id: true,
      },
    });

    const sectorStats = tenants.map(t => ({
      name: t.metier,
      status: t.subscriptionStatus,
      count: t._count.id ?? 0,
    }));

    // 4) Historique MRR (6 derniers mois)
    // On prend les snapshots réels, pas de fallback statique
    const snapshots = await this.prisma.platformMetricSnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const evolution = snapshots.length > 0
      ? snapshots.reverse().map(s => ({
          month: s.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' }),
          mrr: s.totalMrr ?? 0,
        }))
      : []; // Tableau vide si pas d'historique - le frontend affichera un message approprié

    return {
      mrr: currentMrr, // 0 si aucune subscription active
      arr: arr, // 0 si aucune subscription active
      churnRate: churnResult.rate, // null si données insuffisantes
      churnInsufficientData: churnResult.insufficientData,
      arpu, // null si aucun tenant actif
      ltv, // null si churn incalculable ou arpu null
      evolution, // [] si pas d'historique
      sectorStats,
    };
  }
}

