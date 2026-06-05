export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','chambres','reservations','clients','facturation','personnel','menage','services','fournisseurs','rapports','parametres'],
    canCreate: ['chambres','reservations','clients','facturation','personnel','menage','services','fournisseurs'],
    canEdit:   ['chambres','reservations','clients','facturation','personnel','menage','services','fournisseurs'],
    canDelete: ['*'],
  },
  RECEPTIONNISTE: {
    canView:   ['dashboard','chambres','reservations','clients','facturation','menage','services','fournisseurs'],
    canCreate: ['reservations','clients','facturation','menage','services'],
    canEdit:   ['reservations','clients','facturation','menage'],
    canDelete: [],
  },
  PERSONNEL: {
    canView:   ['dashboard','chambres','reservations','menage','services'],
    canCreate: ['menage','services'],
    canEdit:   ['menage','services'],
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
