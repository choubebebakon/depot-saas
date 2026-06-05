export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','tickets','clients','services','commandes','stock','ventes','depenses','rapports','personnel','calendrier','parametres'],
    canCreate: ['tickets','clients','services','commandes','stock','ventes','depenses','personnel'],
    canEdit:   ['tickets','clients','services','commandes','stock','ventes','depenses','personnel'],
    canDelete: ['*'],
  },
  RECEPTEUR: {
    canView:   ['dashboard','tickets','clients','services','stock','calendrier'],
    canCreate: ['tickets','clients'],
    canEdit:   ['tickets','clients'],
    canDelete: [],
  },
  LAVETIER: {
    canView:   ['dashboard','tickets','services','stock','calendrier'],
    canCreate: [],
    canEdit:   ['tickets','services'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.RECEPTEUR;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
