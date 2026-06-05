export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','vehicules','ordres','devis','clients','fournisseurs','pieces','personnel','caisse','depenses','rapports','parametres'],
    canCreate: ['vehicules','ordres','devis','clients','fournisseurs','pieces','personnel','caisse','depenses'],
    canEdit:   ['vehicules','ordres','devis','clients','fournisseurs','pieces','personnel','caisse','depenses'],
    canDelete: ['*'],
  },
  MECANICIEN: {
    canView:   ['dashboard','vehicules','ordres','devis','pieces','caisse'],
    canCreate: ['ordres','devis'],
    canEdit:   ['ordres','pieces'],
    canDelete: [],
  },
  RECEPTIONNISTE: {
    canView:   ['dashboard','vehicules','ordres','clients','caisse'],
    canCreate: ['vehicules','clients','ordres'],
    canEdit:   ['vehicules','clients','ordres'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.RECEPTIONNISTE;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
