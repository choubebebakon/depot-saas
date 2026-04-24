export const ROLES = {
  PATRON: 'PATRON',
  GERANT: 'GERANT',
  CAISSIER: 'CAISSIER',
  MAGASINIER: 'MAGASINIER',
  COMMERCIAL: 'COMMERCIAL',
  COMPTABLE: 'COMPTABLE',
};

/**
 * Niveaux d'accès simplifiés (Standard Professionnel)
 */
export const ACCESS_LEVELS = {
  ADMIN: [ROLES.PATRON],
  GERANT: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMPTABLE],
  VENDEUR: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMMERCIAL, ROLES.MAGASINIER],
};

export function hasRole(role, allowedRoles = []) {
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function filterByRole(items, role) {
  return items.filter((item) => !item.roles || hasRole(role, item.roles));
}




