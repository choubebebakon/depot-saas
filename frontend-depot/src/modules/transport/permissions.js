export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','colis','trajets','flotte','chauffeurs','livraisons','clients','caisse','depenses','rapports','personnel','parametres'],
    canCreate: ['colis','trajets','flotte','chauffeurs','livraisons','clients','caisse','depenses','personnel'],
    canEdit:   ['colis','trajets','flotte','chauffeurs','livraisons','clients','caisse','depenses','personnel'],
    canDelete: ['*'],
  },
  CHAUFFEUR: {
    canView:   ['dashboard','trajets','colis','livraisons'],
    canCreate: ['trajets','livraisons'],
    canEdit:   ['trajets','livraisons'],
    canDelete: [],
  },
  LOGISTICIEN: {
    canView:   ['dashboard','colis','trajets','flotte','chauffeurs','livraisons','clients','caisse'],
    canCreate: ['colis','trajets','livraisons','clients'],
    canEdit:   ['colis','trajets','flotte','livraisons'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.CHAUFFEUR;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
