export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','commandes','menu','ventes','stock','caisse','clients','fournisseurs','depenses','rapports','personnel','parametres'],
    canCreate: ['commandes','menu','ventes','stock','caisse','clients','fournisseurs','depenses','personnel'],
    canEdit:   ['commandes','menu','ventes','stock','caisse','clients','fournisseurs','depenses','personnel'],
    canDelete: ['*'],
  },
  GLACIER: {
    canView:   ['dashboard','commandes','menu','stock'],
    canCreate: ['commandes','menu'],
    canEdit:   ['commandes','menu'],
    canDelete: [],
  },
  CAISSIER: {
    canView:   ['dashboard','ventes','caisse','clients'],
    canCreate: ['ventes','caisse','clients'],
    canEdit:   ['ventes','caisse'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.CAISSIER;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
