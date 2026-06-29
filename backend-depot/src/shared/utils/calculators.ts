// src/shared/utils/calculators.ts

/**
 * Calcule le montant TTC à partir d'un montant HT et d'un taux de TVA (ex: 0.1925 pour 19.25%)
 */
export const calculateTTC = (ht: number, tvaRate: number = 0.1925): number => {
  return Number((ht * (1 + tvaRate)).toFixed(2));
};

/**
 * Calcule une réduction
 */
export const calculateDiscount = (price: number, percent: number): number => {
  return Number((price - price * (percent / 100)).toFixed(2));
};
