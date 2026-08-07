import { BillingCycle, PlanType } from '@prisma/client';

/** Prix mensuels HT en FCFA (XAF) */
export const PLAN_MONTHLY_PRICES: Partial<Record<PlanType, number>> = {
  [PlanType.SOLO]: 25_000,
  [PlanType.PME]: 50_000,
  [PlanType.ENTERPRISE]: 100_000,
};

/** Remise annuelle affichée (-17 %) */
export const ANNUAL_DISCOUNT_RATE = 0.17;

const TVA_RATE = 0.1925;

export function normalizeBillingCycle(
  cycle: string,
): BillingCycle {
  const upper = cycle?.toUpperCase();
  if (upper === 'ANNUAL' || upper === 'YEARLY') return BillingCycle.YEARLY;
  return BillingCycle.MONTHLY;
}

export function calculatePlanAmount(
  plan: PlanType,
  billingCycle: BillingCycle,
): { amount: number; tvaAmount: number; totalAmount: number } {
  const monthly = PLAN_MONTHLY_PRICES[plan];
  if (!monthly) {
    throw new Error(`Plan ${plan} non facturable.`);
  }

  const ht =
    billingCycle === BillingCycle.MONTHLY
      ? monthly
      : Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_RATE));

  const tvaAmount = Math.round(ht * TVA_RATE);
  return { amount: ht, tvaAmount, totalAmount: ht + tvaAmount };
}
