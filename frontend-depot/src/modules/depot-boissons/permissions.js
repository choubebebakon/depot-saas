export const PERMISSIONS = {
  PATRON: {
    canView: ['*'],
    canCreate: ['*'],
    canEdit: ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView: ['dashboard','stock','articles','achats','promotions','consignes','livraisons','tournees','clients','fournisseurs','ventes','caisse','depenses','rapports','parametres'],
    canCreate: ['articles','achats','promotions','clients','fournisseurs','ventes','livraisons','tournees','depenses'],
    canEdit: ['articles','achats','promotions','clients','fournisseurs','ventes','livraisons','tournees'],
    canDelete: ['*'],
  },
  CAISSIER: {
    canView: ['dashboard','stock','articles','clients','ventes','caisse'],
    canCreate: ['ventes','clients'],
    canEdit: ['ventes'],
    canDelete: [],
  },
  MAGASINIER: {
    canView: ['dashboard','stock','articles','achats','promotions','consignes','livraisons','fournisseurs'],
    canCreate: ['articles','achats','promotions','livraisons'],
    canEdit: ['articles','achats','promotions','livraisons'],
    canDelete: [],
  },
  COMMERCIAL: {
    canView: ['dashboard','stock','articles','promotions','consignes','livraisons','tournees','clients','ventes','rapports'],
    canCreate: ['clients','ventes','livraisons','tournees'],
    canEdit: ['clients'],
    canDelete: [],
  },
  COMPTABLE: {
    canView: ['dashboard','ventes','caisse','depenses','rapports','clients','fournisseurs','achats'],
    canCreate: ['depenses','achats'],
    canEdit: ['achats'],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  if (rolePerms[action]?.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
