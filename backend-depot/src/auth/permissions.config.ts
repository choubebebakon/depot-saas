import { Role } from '@prisma/client';

export type PermissionMetier = 'supermarche' | 'boutique' | 'depot';

export const ADMINISTRATION_SUBMODULES = new Set([
  'utilisateurs',
  'depots',
  'abonnement',
  'parametres',
  'administration',
]);

/**
 * §3/§23 — Sous-modules interdits au GERANT (gérant d'ÉTABLISSEMENT, pas
 * administrateur du tenant) : audit patron, abonnement, administration des
 * établissements. Source unique de vérité, miroir dans
 * `frontend-depot/src/shared/permissions/matrix.js` (verrouillé par
 * `frontend-matrix-parity.spec.ts`).
 */
export const GERANT_DENY_SOUS_MODULES: readonly string[] = [
  'audit_patron',
  'abonnement',
  'depots',
];

export const ROLE_LABELS_BY_METIER: Record<
  PermissionMetier,
  Partial<Record<Role, string>>
> = {
  supermarche: {
    [Role.MAGASINIER]: 'Rayonniste',
    [Role.CAISSIER]: 'Caissier(ère)',
    [Role.COMPTABLE]: 'Comptable',
    [Role.COMMERCIAL]: 'Commercial',
    [Role.PATRON]: 'Patron',
    [Role.GERANT]: 'Gérant',
  },
  boutique: {
    [Role.MAGASINIER]: 'Vendeur',
    [Role.CAISSIER]: 'Caissier(ère)',
    [Role.COMPTABLE]: 'Comptable',
    [Role.COMMERCIAL]: 'Commercial',
    [Role.PATRON]: 'Patron',
    [Role.GERANT]: 'Gérant',
  },
  depot: {
    [Role.MAGASINIER]: 'Magasinier / Livreur',
    [Role.CAISSIER]: 'Caissier(ère)',
    [Role.COMPTABLE]: 'Comptable',
    [Role.COMMERCIAL]: 'Commercial',
    [Role.PATRON]: 'Patron',
    [Role.GERANT]: 'Gérant',
  },
};

export function roleLabel(role: string, metier: PermissionMetier): string {
  return (
    ROLE_LABELS_BY_METIER[metier]?.[role as Role] ||
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  );
}

export function normalizePermissionMetier(
  raw?: string | null,
): PermissionMetier | null {
  if (!raw) return null;

  const value = raw.toLowerCase().replace(/_/g, '-');
  if (value === 'supermarche') return 'supermarche';
  if (value === 'boutique') return 'boutique';
  if (value === 'depot' || value === 'depot-boissons') return 'depot';

  return null;
}

export function normalizeSousModule(raw: string): string {
  return raw.replace(/-/g, '_');
}
