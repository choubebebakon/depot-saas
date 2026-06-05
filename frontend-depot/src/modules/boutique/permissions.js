export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','ventes','stock','clients','caisse','promotions','factures','fournisseurs','rapports','depenses','personnel','parametres'],
    canCreate: ['ventes','stock','clients','caisse','promotions','factures','fournisseurs','depenses','personnel'],
    canEdit:   ['ventes','stock','clients','caisse','promotions','factures','fournisseurs','depenses','personnel'],
    canDelete: ['*'],
  },
  VENDEUR: {
    canView:   ['dashboard','ventes','stock','clients','caisse','promotions'],
    canCreate: ['ventes','clients','caisse'],
    canEdit:   ['ventes','caisse'],
    canDelete: [],
  },
  COMPTABLE: {
    canView:   ['dashboard','ventes','stock','caisse','factures','rapports','depenses'],
    canCreate: [],
    canEdit:   [],
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
