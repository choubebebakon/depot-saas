// src/shared/utils/formatters.ts

/**
 * Formate un nombre en devise FCFA
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
  }).format(amount);
};

/**
 * Formate une date en format lisible (ex: 23 Mai 2026)
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};
