export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','produits','categories','stock','clients','ventes','fidelite','fournisseurs','depenses','rapports','personnel','parametres'],
    canCreate: ['produits','categories','stock','clients','ventes','fidelite','fournisseurs','depenses','personnel'],
    canEdit:   ['produits','categories','stock','clients','ventes','fidelite','fournisseurs','depenses','personnel'],
    canDelete: ['*'],
  },
  VENDEUR: {
    canView:   ['dashboard','produits','clients','ventes','fidelite','stock'],
    canCreate: ['clients','ventes','fidelite'],
    canEdit:   ['clients','ventes'],
    canDelete: [],
  },
  MAGASINIER: {
    canView:   ['dashboard','produits','categories','stock','fournisseurs'],
    canCreate: ['produits','stock'],
    canEdit:   ['produits','stock'],
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
