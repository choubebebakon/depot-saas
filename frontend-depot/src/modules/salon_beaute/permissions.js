export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','rendez-vous','agenda','prestations','clients','stock','ventes','depenses','rapports','personnel','abonnements','parametres'],
    canCreate: ['rendez-vous','agenda','prestations','clients','stock','ventes','depenses','personnel','abonnements'],
    canEdit:   ['rendez-vous','agenda','prestations','clients','stock','ventes','depenses','personnel','abonnements'],
    canDelete: ['*'],
  },
  COIFFEUR: {
    canView:   ['dashboard','rendez-vous','agenda','prestations','clients','stock','abonnements'],
    canCreate: ['rendez-vous','clients'],
    canEdit:   ['rendez-vous','prestations'],
    canDelete: [],
  },
  RECEPTEUR: {
    canView:   ['dashboard','agenda','clients','prestations','ventes'],
    canCreate: ['rendez-vous','clients','ventes'],
    canEdit:   ['rendez-vous','clients'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.COIFFEUR;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
