// ─────────────────────────────────────────────────────────────────
// plan-quotas.config.ts
// Mappe chaque plan d'abonnement à ses limites d'utilisation.
// Structure extensible : ajouter une limite = ajouter une clé.
// ─────────────────────────────────────────────────────────────────

export enum PlanType {
  FREE = 'FREE',
  TRIAL = 'TRIAL',
  SOLO = 'SOLO',
  BASIC = 'BASIC',
  PME = 'PME',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
  UNLIMITED = 'UNLIMITED',
}

export interface PlanQuota {
  depots: number; // Nombre max de dépôts
  utilisateurs: number; // Nombre max d'utilisateurs
  articles: number; // Nombre max d'articles en stock
  clients: number; // Nombre max de clients
  factures: number; // Nombre max de factures/mois
  fournisseurs: number; // Nombre max de fournisseurs
  exportPDF: boolean; // Export PDF activé
  rapports: boolean; // Accès aux rapports
  multiDepot: boolean; // Gestion multi-dépôts
  support: 'basic' | 'priority' | 'dedicated';
}

export const PLAN_QUOTAS: Record<PlanType, PlanQuota> = {
  [PlanType.FREE]: {
    depots: 1,
    utilisateurs: 1,
    articles: 50,
    clients: 20,
    factures: 10,
    fournisseurs: 5,
    exportPDF: false,
    rapports: false,
    multiDepot: false,
    support: 'basic',
  },

  [PlanType.TRIAL]: {
    depots: 1,
    utilisateurs: 2,
    articles: 100,
    clients: 50,
    factures: 30,
    fournisseurs: 10,
    exportPDF: true,
    rapports: true,
    multiDepot: false,
    support: 'basic',
  },

  [PlanType.SOLO]: {
    depots: 1,
    utilisateurs: 3,
    articles: 500,
    clients: 200,
    factures: 100,
    fournisseurs: 20,
    exportPDF: true,
    rapports: true,
    multiDepot: false,
    support: 'basic',
  },

  [PlanType.BASIC]: {
    depots: 2,
    utilisateurs: 5,
    articles: 1000,
    clients: 500,
    factures: 300,
    fournisseurs: 50,
    exportPDF: true,
    rapports: true,
    multiDepot: false,
    support: 'basic',
  },

  [PlanType.PME]: {
    depots: 3,
    utilisateurs: 10,
    articles: 5000,
    clients: 2000,
    factures: 1000,
    fournisseurs: 100,
    exportPDF: true,
    rapports: true,
    multiDepot: true,
    support: 'priority',
  },

  [PlanType.PREMIUM]: {
    depots: 10,
    utilisateurs: 25,
    articles: 20000,
    clients: 10000,
    factures: 5000,
    fournisseurs: 500,
    exportPDF: true,
    rapports: true,
    multiDepot: true,
    support: 'priority',
  },

  [PlanType.ENTERPRISE]: {
    depots: 50,
    utilisateurs: 100,
    articles: 100000,
    clients: 50000,
    factures: Infinity,
    fournisseurs: Infinity,
    exportPDF: true,
    rapports: true,
    multiDepot: true,
    support: 'dedicated',
  },

  [PlanType.UNLIMITED]: {
    depots: Infinity,
    utilisateurs: Infinity,
    articles: Infinity,
    clients: Infinity,
    factures: Infinity,
    fournisseurs: Infinity,
    exportPDF: true,
    rapports: true,
    multiDepot: true,
    support: 'dedicated',
  },
};

// ─── Helper : vérifie si une limite est atteinte ─────────────────
export function isQuotaExceeded(
  plan: PlanType,
  ressource: keyof Pick<
    PlanQuota,
    | 'depots'
    | 'utilisateurs'
    | 'articles'
    | 'clients'
    | 'factures'
    | 'fournisseurs'
  >,
  count: number,
): boolean {
  const limit = PLAN_QUOTAS[plan][ressource];
  return count >= limit;
}

// ─── Helper : message d'erreur lisible ───────────────────────────
export function getQuotaErrorMessage(
  plan: PlanType,
  ressource: string,
): string {
  return `Limite de ${ressource} atteinte pour le plan ${plan}. Passez à un plan supérieur pour continuer.`;
}

// ─── Helper : récupère la limite d'une ressource ─────────────────
export function getQuotaLimit(
  plan: PlanType,
  ressource: keyof PlanQuota,
): number | boolean | string {
  return PLAN_QUOTAS[plan][ressource];
}
