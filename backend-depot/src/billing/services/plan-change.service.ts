import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { BillingCycle, PlanType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { calculatePlanAmount } from '../../common/config/subscription-pricing.config';
import {
  comparePlans,
  getMaxDepotsForPlan,
  PlanChangeType,
} from '../config/plan-ranks.config';

export interface PlanChangeQuote {
  changeType: PlanChangeType;
  targetPlan: PlanType;
  billingCycle: BillingCycle;
  fullAmount: number;
  chargeAmount: number;
  prorataCredit: number;
  activeDepots: number;
  targetDepotLimit: number;
}

@Injectable()
export class PlanChangeService {
  private readonly logger = new Logger(PlanChangeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valide un changement de plan et calcule le montant à facturer.
   * Bloque les downgrades si le quota de dépôts serait dépassé.
   */
  async quotePlanChange(
    tenantId: string,
    targetPlan: PlanType,
    billingCycle: BillingCycle,
  ): Promise<PlanChangeQuote> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        planType: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
        subscriptionStatus: true,
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant introuvable.');
    }

    const currentPlan = tenant.planType ?? PlanType.TRIAL;
    const { changeType } = comparePlans(currentPlan, targetPlan);
    const targetAmounts = calculatePlanAmount(targetPlan, billingCycle);
    const activeDepots = await this.prisma.depot.count({
      where: { tenantId, isArchived: false },
    });
    const targetDepotLimit = getMaxDepotsForPlan(targetPlan);

    if (changeType === 'DOWNGRADE' && activeDepots > targetDepotLimit) {
      const toRemove = activeDepots - targetDepotLimit;
      throw new BadRequestException({
        error: 'DOWNGRADE_BLOCKED',
        message: `Impossible de rétrograder votre plan. Vous devez d'abord supprimer ou désactiver ${toRemove} dépôt${toRemove > 1 ? 's' : ''} pour respecter la limite du plan ${targetPlan} (${targetDepotLimit} dépôt${targetDepotLimit > 1 ? 's' : ''} max).`,
        metadata: {
          currentPlan,
          targetPlan,
          activeDepots,
          targetDepotLimit,
          depotsToRemove: toRemove,
        },
      });
    }

    const subscriptionEnd =
      tenant.currentPeriodEnd ?? tenant.trialEndsAt ?? null;
    const { chargeAmount, prorataCredit } = this.calculateChargeAmount({
      changeType,
      currentPlan,
      targetPlan,
      billingCycle,
      subscriptionEnd,
      fullAmount: targetAmounts.totalAmount,
    });

    this.logger.log(
      `Quote ${tenantId}: ${currentPlan} → ${targetPlan} (${changeType}) = ${chargeAmount} FCFA`,
    );

    return {
      changeType,
      targetPlan,
      billingCycle,
      fullAmount: targetAmounts.totalAmount,
      chargeAmount,
      prorataCredit,
      activeDepots,
      targetDepotLimit,
    };
  }

  private calculateChargeAmount(input: {
    changeType: PlanChangeType;
    currentPlan: PlanType;
    targetPlan: PlanType;
    billingCycle: BillingCycle;
    subscriptionEnd: Date | null;
    fullAmount: number;
  }): { chargeAmount: number; prorataCredit: number } {
    const now = new Date();

    if (
      input.changeType === 'NEW' ||
      input.changeType === 'RENEWAL' ||
      input.changeType === 'SAME' ||
      !input.subscriptionEnd ||
      input.subscriptionEnd <= now
    ) {
      return { chargeAmount: input.fullAmount, prorataCredit: 0 };
    }

    if (input.changeType === 'DOWNGRADE') {
      // Downgrade planifié : pas de remboursement immédiat, facturation au renouvellement
      return { chargeAmount: input.fullAmount, prorataCredit: 0 };
    }

    // Upgrade : prorata temporis sur la période restante
    try {
      const currentAmounts = calculatePlanAmount(
        input.currentPlan,
        input.billingCycle,
      );
      const periodMs =
        input.billingCycle === BillingCycle.YEARLY
          ? 365 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

      const remainingMs = Math.max(
        0,
        input.subscriptionEnd.getTime() - now.getTime(),
      );
      const ratio = Math.min(1, remainingMs / periodMs);
      const prorataCredit = Math.round(currentAmounts.totalAmount * ratio);
      const chargeAmount = Math.max(0, input.fullAmount - prorataCredit);

      return { chargeAmount, prorataCredit };
    } catch {
      return { chargeAmount: input.fullAmount, prorataCredit: 0 };
    }
  }

  resolveChangeType(
    currentPlan: PlanType,
    targetPlan: PlanType,
    isExpired: boolean,
  ): PlanChangeType {
    if (isExpired) return 'RENEWAL';
    const { changeType } = comparePlans(currentPlan, targetPlan);
    if (changeType === 'SAME') return 'RENEWAL';
    return changeType;
  }
}
