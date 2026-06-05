export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','ventes','devis','chantiers','livraisons','vehicules','stock','clients','fournisseurs','rapports','personnel','parametres'],
    canCreate: ['ventes','devis','chantiers','livraisons','vehicules','stock','clients','fournisseurs','personnel'],
    canEdit:   ['ventes','devis','chantiers','livraisons','vehicules','stock','clients','fournisseurs','personnel'],
    canDelete: ['*'],
  },
  CHEF_CHANTIER: {
    canView:   ['dashboard','chantiers','livraisons','vehicules','stock'],
    canCreate: ['chantiers','livraisons'],
    canEdit:   ['chantiers','livraisons'],
    canDelete: [],
  },
  COMMERCIAL: {
    canView:   ['dashboard','ventes','devis','clients'],
    canCreate: ['ventes','devis','clients'],
    canEdit:   ['ventes','devis'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.COMMERCIAL;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
