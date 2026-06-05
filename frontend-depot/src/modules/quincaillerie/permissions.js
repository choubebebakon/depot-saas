export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','produits','categories','stock','clients','fournisseurs','ventes','chantiers','devis','depenses','rapports','parametres'],
    canCreate: ['produits','categories','stock','clients','fournisseurs','ventes','chantiers','devis','depenses'],
    canEdit:   ['produits','categories','stock','clients','fournisseurs','ventes','chantiers','devis','depenses'],
    canDelete: ['*'],
  },
  VENDEUR: {
    canView:   ['dashboard','produits','stock','clients','ventes','depenses'],
    canCreate: ['clients','ventes'],
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
