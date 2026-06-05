export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','biens','contrats','loyers','locataires','interventions','depenses','documents','visites','rapports','personnel','parametres'],
    canCreate: ['biens','contrats','loyers','locataires','interventions','depenses','documents','visites','personnel'],
    canEdit:   ['biens','contrats','loyers','locataires','interventions','depenses','documents','visites','personnel'],
    canDelete: ['*'],
  },
  AGENT_IMMO: {
    canView:   ['dashboard','biens','contrats','loyers','locataires','interventions','visites'],
    canCreate: ['biens','contrats','loyers','locataires','interventions','visites'],
    canEdit:   ['biens','contrats','locataires','interventions'],
    canDelete: [],
  },
  COMPTABLE: {
    canView:   ['dashboard','loyers','depenses','rapports','documents'],
    canCreate: ['loyers','depenses','documents'],
    canEdit:   ['loyers','depenses'],
    canDelete: [],
  },
};
export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.AGENT_IMMO;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}
export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
