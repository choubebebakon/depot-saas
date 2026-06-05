export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','tables','commandes','menu','cuisine','reservations','caisse','stock','clients','fournisseurs','rapports','parametres'],
    canCreate: ['tables','commandes','menu','cuisine','reservations','caisse','stock','clients','fournisseurs'],
    canEdit:   ['tables','commandes','menu','cuisine','reservations','stock','clients','fournisseurs'],
    canDelete: ['*'],
  },
  SERVEUR: {
    canView:   ['dashboard','tables','commandes','menu','reservations','caisse','clients'],
    canCreate: ['commandes','reservations','caisse','clients'],
    canEdit:   ['commandes','reservations'],
    canDelete: [],
  },
  CUISINIER: {
    canView:   ['dashboard','commandes','menu','cuisine','stock'],
    canCreate: [],
    canEdit:   ['commandes','cuisine'],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.SERVEUR;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
