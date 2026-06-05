export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','troupeaux','evenements','alimentation','sante','reproduction','ventes','stock','depenses','rapports','parametres'],
    canCreate: ['troupeaux','evenements','alimentation','sante','reproduction','ventes','stock','depenses'],
    canEdit:   ['troupeaux','evenements','alimentation','sante','reproduction','ventes','stock','depenses'],
    canDelete: ['*'],
  },
  ELEVEUR: {
    canView:   ['dashboard','troupeaux','evenements','alimentation','sante','reproduction','stock'],
    canCreate: ['troupeaux','evenements','alimentation','sante','reproduction'],
    canEdit:   ['troupeaux','evenements','alimentation','sante','reproduction'],
    canDelete: [],
  },
  PERSONNEL: {
    canView:   ['dashboard','troupeaux','alimentation','stock'],
    canCreate: ['alimentation'],
    canEdit:   ['alimentation'],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.PERSONNEL;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
