export const ROLES = {
  PATRON: 'PATRON',
  GERANT: 'GERANT',
  CAISSIER: 'CAISSIER',
  MAGASINIER: 'MAGASINIER',
  COMMERCIAL: 'COMMERCIAL',
  COMPTABLE: 'COMPTABLE',
};

export function hasRole(role, allowedRoles = []) {
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function filterByRole(items, role) {
  return items.filter((item) => !item.roles || hasRole(role, item.roles));
}
