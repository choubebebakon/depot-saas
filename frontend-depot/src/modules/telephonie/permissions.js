export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','telephones','accessoires','reparations','clients','fournisseurs','ventes','recharges','stock','depenses','rapports','parametres'],
    canCreate: ['telephones','accessoires','reparations','clients','fournisseurs','ventes','recharges','stock','depenses'],
    canEdit:   ['telephones','accessoires','reparations','clients','fournisseurs','ventes','recharges','stock','depenses'],
    canDelete: ['*'],
  },
  VENDEUR: {
    canView:   ['dashboard','telephones','accessoires','clients','ventes','recharges','stock'],
    canCreate: ['clients','ventes','recharges'],
    canEdit:   ['clients','ventes'],
    canDelete: [],
  },
  TECHNICIEN: {
    canView:   ['dashboard','reparations','telephones','stock'],
    canCreate: ['reparations'],
    canEdit:   ['reparations'],
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
