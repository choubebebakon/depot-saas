export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','catalogue','ventes','commandes','stock','caisse','clients','fournisseurs','depenses','rapports','personnel','parametres'],
    canCreate: ['catalogue','ventes','commandes','stock','caisse','clients','fournisseurs','depenses','personnel'],
    canEdit:   ['catalogue','ventes','commandes','stock','caisse','clients','fournisseurs','depenses','personnel'],
    canDelete: ['*'],
  },
  LIBRAIRE: {
    canView:   ['dashboard','catalogue','commandes','stock'],
    canCreate: ['catalogue','commandes','stock'],
    canEdit:   ['catalogue','commandes','stock'],
    canDelete: [],
  },
  VENDEUR: {
    canView:   ['dashboard','catalogue','ventes','caisse','clients'],
    canCreate: ['ventes','caisse','clients'],
    canEdit:   ['ventes','caisse'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.VENDEUR;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
