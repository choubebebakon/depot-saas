import { PlanType } from '@prisma/client';
import { getDepotLimitForPlan } from '../../common/plan-limits';

/** Hiérarchie des plans pour upgrade/downgrade (plus élevé = plan supérieur). */
export const PLAN_RANK: Record<PlanType, number> = {
  [PlanType.FREE]: 0,
  [PlanType.TRIAL]: 0,
  [PlanType.SOLO]: 1,
  [PlanType.BASIC]: 1,
  [PlanType.PME]: 2,
  [PlanType.PREMIUM]: 2,
  [PlanType.ENTERPRISE]: 3,
  [PlanType.UNLIMITED]: 4,
};

export type PlanChangeType = 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'SAME';

export function getPlanRank(plan: PlanType): number {
  return PLAN_RANK[plan] ?? 0;
}

export function comparePlans(
  current: PlanType,
  target: PlanType,
): { changeType: PlanChangeType; rankDelta: number } {
  const rankDelta = getPlanRank(target) - getPlanRank(current);
  if (rankDelta > 0) return { changeType: 'UPGRADE', rankDelta };
  if (rankDelta < 0) return { changeType: 'DOWNGRADE', rankDelta };
  return { changeType: 'SAME', rankDelta: 0 };
}

export function getMaxDepotsForPlan(plan: PlanType): number {
  return getDepotLimitForPlan(plan);
}
