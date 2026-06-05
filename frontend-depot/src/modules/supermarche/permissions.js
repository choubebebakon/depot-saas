export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','pos','stock','rayons','promotions','clients','fournisseurs','receptions','inventaire','depenses','rapports','parametres'],
    canCreate: ['pos','stock','rayons','promotions','clients','fournisseurs','receptions','inventaire','depenses'],
    canEdit:   ['pos','stock','rayons','promotions','clients','fournisseurs','receptions','inventaire'],
    canDelete: ['*'],
  },
  SUPERVISEUR: {
    canView:   ['*'],
    canCreate: ['pos','stock','rayons','clients','fournisseurs'],
    canEdit:   ['pos','stock','rayons','clients','fournisseurs'],
    canDelete: [],
  },
  VENDEUR: {
    canView:   ['dashboard','pos','stock','clients'],
    canCreate: ['pos','clients'],
    canEdit:   ['pos'],
    canDelete: [],
  },
  CAISSIER: {
    canView:   ['dashboard','pos','clients'],
    canCreate: ['pos','clients'],
    canEdit:   ['pos'],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.CAISSIER;
  if (rolePerms[action]?.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
