import { PlanType } from '@prisma/client';

export const PLAN_DEPOT_LIMITS: Record<PlanType, number> = {
  FREE: 1,
  BASIC: 1,
  PREMIUM: 5,
  ENTERPRISE: 20,
  SOLO: 1,
  PME: 3,
  TRIAL: 1,
  UNLIMITED: Number.MAX_SAFE_INTEGER,
};

export function getDepotLimitForPlan(planType: PlanType): number {
  return PLAN_DEPOT_LIMITS[planType];
}

export function getSuggestedPlanForPlan(planType: PlanType): PlanType | null {
  const suggestions: Record<PlanType, PlanType | null> = {
    FREE: PlanType.SOLO,
    BASIC: PlanType.PME,
    PREMIUM: PlanType.ENTERPRISE,
    ENTERPRISE: PlanType.UNLIMITED,
    SOLO: PlanType.PME,
    PME: PlanType.ENTERPRISE,
    TRIAL: PlanType.SOLO,
    UNLIMITED: null,
  };

  return suggestions[planType];
}
