import { Role } from '@prisma/client';

export type PermissionMetier = 'supermarche' | 'boutique' | 'depot';

export const ADMINISTRATION_SUBMODULES = new Set([
  'utilisateurs',
  'depots',
  'abonnement',
  'parametres',
  'administration',
]);

export const ROLE_LABELS_BY_METIER: Record<
  PermissionMetier,
  Partial<Record<Role, string>>
> = {
  supermarche: {
    [Role.MAGASINIER]: 'Rayonniste',
    [Role.CAISSIER]: 'Caissier(ere)',
    [Role.COMPTABLE]: 'Comptable',
    [Role.COMMERCIAL]: 'Commercial',
    [Role.PATRON]: 'Patron',
    [Role.GERANT]: 'Gerant',
  },
  boutique: {
    [Role.MAGASINIER]: 'Vendeur',
    [Role.CAISSIER]: 'Caissier(ere)',
    [Role.COMPTABLE]: 'Comptable',
    [Role.COMMERCIAL]: 'Commercial',
    [Role.PATRON]: 'Patron',
    [Role.GERANT]: 'Gerant',
  },
  depot: {
    [Role.MAGASINIER]: 'Magasinier / Livreur',
    [Role.CAISSIER]: 'Caissier(ere)',
    [Role.COMPTABLE]: 'Comptable',
    [Role.COMMERCIAL]: 'Commercial',
    [Role.PATRON]: 'Patron',
    [Role.GERANT]: 'Gerant',
  },
};

export function roleLabel(role: string, metier: PermissionMetier): string {
  return (
    ROLE_LABELS_BY_METIER[metier]?.[role as Role] ||
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  );
}

export function normalizePermissionMetier(raw?: string | null): PermissionMetier | null {
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
