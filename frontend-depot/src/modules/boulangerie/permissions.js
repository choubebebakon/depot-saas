export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','production','recettes','produits','ventes','stock','fournisseurs','clients','depenses','rapports','personnel','parametres'],
    canCreate: ['production','recettes','produits','ventes','stock','fournisseurs','clients','depenses','personnel'],
    canEdit:   ['production','recettes','produits','ventes','stock','fournisseurs','clients','depenses','personnel'],
    canDelete: ['*'],
  },
  BOULANGER: {
    canView:   ['dashboard','production','recettes','stock'],
    canCreate: ['production'],
    canEdit:   ['production','recettes'],
    canDelete: [],
  },
  VENDEUR: {
    canView:   ['dashboard','produits','ventes','clients'],
    canCreate: ['ventes','clients'],
    canEdit:   ['ventes'],
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
