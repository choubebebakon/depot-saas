export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','stock','articles','consignes','livraisons','tournees','clients','fournisseurs','ventes','caisse','depenses','rapports','parametres'],
    canCreate: ['articles','clients','fournisseurs','ventes','livraisons','tournees','depenses'],
    canEdit:   ['articles','clients','fournisseurs','ventes','livraisons','tournees'],
    canDelete: ['*'],
  },
  CAISSIER: {
    canView:   ['dashboard','stock','articles','clients','ventes','caisse'],
    canCreate: ['ventes','clients'],
    canEdit:   ['ventes'],
    canDelete: [],
  },
  MAGASINIER: {
    canView:   ['dashboard','stock','articles','consignes','livraisons','fournisseurs'],
    canCreate: ['articles','livraisons'],
    canEdit:   ['articles','livraisons'],
    canDelete: [],
  },
  COMMERCIAL: {
    canView:   ['dashboard','stock','articles','consignes','livraisons','tournees','clients','ventes','rapports'],
    canCreate: ['clients','ventes','livraisons','tournees'],
    canEdit:   ['clients'],
    canDelete: [],
  },
  COMPTABLE: {
    canView:   ['dashboard','ventes','caisse','depenses','rapports','clients','fournisseurs'],
    canCreate: ['depenses'],
    canEdit:   [],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
