import { Role } from '@prisma/client';

/**
 * §11/§23 — Matrice de référence RBAC (source unique de vérité).
 *
 * Ce fichier ne contient AUCUN effet de bord (pas de PrismaClient, pas de
 * dotenv) : il est consommé à la fois par `prisma/seed-permissions.ts`
 * (écriture en base) et par `src/auth/rbac-matrix.spec.ts` (tests §21).
 *
 * Convention : une ligne absente = permission refusée (deny-by-default).
 *   canRead  → le sous-module apparaît dans la navigation
 *   canWrite → les actions de modification sont autorisées
 *
 * PATRON et GERANT ne figurent jamais ici : leurs droits sont calculés en
 * code par `PermissionService` (PATRON = tout, GERANT = tout SAUF
 * audit_patron / abonnement / depots — §3/§23).
 */

export type PermissionSeedMetier = 'supermarche' | 'boutique' | 'depot';

export interface PermissionSeedRow {
  role: Role;
  metier: PermissionSeedMetier;
  sousModule: string;
  canRead: boolean;
  canWrite: boolean;
}

/** Helper : [sousModule, canRead, canWrite][] -> lignes de seed. */
const R = (
  role: Role,
  metier: PermissionSeedMetier,
  rows: Array<[string, boolean, boolean]>,
): PermissionSeedRow[] =>
  rows.map(([sousModule, canRead, canWrite]) => ({
    role,
    metier,
    sousModule,
    canRead,
    canWrite,
  }));

export const PERMISSION_SEED: PermissionSeedRow[] = [
  // SUPERMARCHE (§8)
  // MAGASINIER (Rayonniste) : stock/rayons/reception/inventaire ✅ — caisse ❌
  ...R(Role.MAGASINIER, 'supermarche', [
    ['dashboard', true, false],
    ['rayons', true, true],
    ['stock', true, true],
    ['receptions', true, true],
    ['inventaire', true, true],
    ['fournisseurs', true, false],
    ['ventes', true, false],
    ['rapports_stock', true, false],
    ['promotions', true, false],
  ]),
  // CAISSIER : POS/caisse ✅, ventes ✅ — produits/promotions 👁️ — depenses ❌
  // rapports.* ❌ (aucune ligne rapports) — §10
  ...R(Role.CAISSIER, 'supermarche', [
    ['dashboard', true, false],
    ['pos_caisse', true, true],
    ['ventes', true, true],
    ['clients', true, false],
    ['stock', true, false],
    ['rayons', true, false],
    ['promotions', true, false],
  ]),
  // COMMERCIAL : vend + clientele — stock 👁️, jamais caisse
  // « Mes performances » seulement (rapports_performance) — §10
  ...R(Role.COMMERCIAL, 'supermarche', [
    ['dashboard', true, false],
    ['stock', true, false],
    ['ventes', true, true],
    ['clients', true, true],
    ['promotions', true, true],
    ['rapports_performance', true, false],
  ]),
  // COMPTABLE : vision financiere 👁️, depenses/fournisseurs/rapports ✅
  ...R(Role.COMPTABLE, 'supermarche', [
    ['dashboard', true, false],
    ['stock', true, false],
    ['rayons', true, false],
    ['inventaire', true, false],
    ['receptions', true, false],
    ['pos_caisse', true, false],
    ['ventes', true, false],
    ['clients', true, false],
    ['promotions', true, false],
    ['fournisseurs', true, true],
    ['depenses', true, true],
    ['rapports', true, true],
  ]),

  // BOUTIQUE (§7)
  // MAGASINIER : stock/reception/inventaire/categories ✅ — ventes 👁️ — caisse ❌
  ...R(Role.MAGASINIER, 'boutique', [
    ['dashboard', true, false],
    ['ventes', true, false],
    ['stock', true, true],
    ['receptions', true, true],
    ['inventaire', true, true],
    ['categories', true, true],
    ['clients', true, false],
    ['rapports_stock', true, false],
  ]),
  // CAISSIER : ventes/caisse/factures ✅ — produits/promotions 👁️
  ...R(Role.CAISSIER, 'boutique', [
    ['dashboard', true, false],
    ['ventes', true, true],
    ['caisse', true, true],
    ['factures', true, false],
    ['clients', true, false],
    ['stock', true, false],
    ['categories', true, false],
    ['promotions', true, false],
  ]),
  // COMMERCIAL : vente ✅ + clientele ✅ — stock 👁️, jamais caisse
  ...R(Role.COMMERCIAL, 'boutique', [
    ['dashboard', true, false],
    ['stock', true, false],
    ['ventes', true, true],
    ['clients', true, true],
    ['promotions', true, true],
    ['factures', true, false],
    ['rapports_performance', true, false],
  ]),
  // COMPTABLE : finance 👁️ + clotures — jamais d'ecriture stock
  ...R(Role.COMPTABLE, 'boutique', [
    ['dashboard', true, false],
    ['stock', true, false],
    ['inventaire', true, false],
    ['receptions', true, false],
    ['caisse', true, false],
    ['ventes', true, false],
    ['categories', true, false],
    ['promotions', true, false],
    ['clients', true, false],
    ['factures', true, true],
    ['fournisseurs', true, true],
    ['depenses', true, true],
    ['rapports', true, true],
  ]),

  // DEPOT DE BOISSONS (§9)
  // MAGASINIER/LIVREUR : stock/tournees/livraisons/consigne ✅ — ventes 👁️
  ...R(Role.MAGASINIER, 'depot', [
    ['dashboard', true, false],
    ['stock_articles', true, true],
    ['inventaire', true, true],
    ['consignes', true, true],
    ['livraisons', true, true],
    ['tournees', true, true],
    ['fournisseurs', true, false],
    ['ventes', true, false],
    ['rapports_stock', true, false],
  ]),
  // CAISSIER : ventes/caisse/clients ✅ — consigne/stock/factures 👁️ — tournees ❌
  ...R(Role.CAISSIER, 'depot', [
    ['dashboard', true, false],
    ['ventes', true, true],
    ['caisse', true, true],
    ['clients', true, false],
    ['consignes', true, false],
    ['stock_articles', true, false],
    ['factures', true, false],
  ]),
  // COMMERCIAL : ventes/tournees/livraisons ✅ + son portefeuille — stock 👁️
  ...R(Role.COMMERCIAL, 'depot', [
    ['dashboard', true, false],
    ['stock_articles', true, false],
    ['ventes', true, true],
    ['clients', true, true],
    ['tournees', true, true],
    ['livraisons', true, true],
    ['rapports_performance', true, false],
  ]),
  // COMPTABLE : finance 👁️, depenses/fournisseurs/rapports ✅ — stock ❌ ecriture
  ...R(Role.COMPTABLE, 'depot', [
    ['dashboard', true, false],
    ['stock_articles', true, false],
    ['inventaire', true, false],
    ['consignes', true, false],
    ['tournees', true, false],
    ['livraisons', true, false],
    ['caisse', true, false],
    ['ventes', true, false],
    ['clients', true, false],
    ['factures', true, true],
    ['fournisseurs', true, true],
    ['depenses', true, true],
    ['rapports', true, true],
  ]),
];

/** Index rapide `role|metier|sousModule` -> ligne (lecture O(1) côté tests). */
export const PERMISSION_SEED_INDEX: Map<string, PermissionSeedRow> = new Map(
  PERMISSION_SEED.map((row) => [
    `${row.role}|${row.metier}|${row.sousModule}`,
    row,
  ]),
);
