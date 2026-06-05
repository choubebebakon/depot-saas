export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','medicaments','ordonnances','alertes-dlc','stock','lots','patients','fournisseurs','ventes','caisse','retours','rapports','parametres'],
    canCreate: ['medicaments','ordonnances','stock','lots','patients','fournisseurs','ventes','caisse','retours'],
    canEdit:   ['medicaments','ordonnances','stock','lots','patients','fournisseurs','retours'],
    canDelete: ['*'],
  },
  PHARMACIEN: {
    canView:   ['dashboard','medicaments','ordonnances','alertes-dlc','stock','lots','patients','fournisseurs','ventes','caisse','retours','rapports'],
    canCreate: ['medicaments','ordonnances','stock','lots','patients','fournisseurs','ventes','caisse','retours'],
    canEdit:   ['medicaments','ordonnances','stock','lots','patients','retours'],
    canDelete: [],
  },
  CAISSIER: {
    canView:   ['dashboard','medicaments','ventes','caisse','patients'],
    canCreate: ['ventes','caisse','patients'],
    canEdit:   ['ventes'],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.CAISSIER;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
