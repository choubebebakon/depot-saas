export const PERMISSIONS = {
  PATRON: {
    canView:   ['*'],
    canCreate: ['*'],
    canEdit:   ['*'],
    canDelete: ['*'],
  },
  GERANT: {
    canView:   ['dashboard','medecins','patients','consultations','prescriptions','rendez-vous','medicaments','caisse','rapports','parametres'],
    canCreate: ['medecins','patients','consultations','prescriptions','rendez-vous','medicaments','caisse'],
    canEdit:   ['medecins','patients','consultations','prescriptions','rendez-vous','medicaments'],
    canDelete: ['*'],
  },
  MEDECIN: {
    canView:   ['dashboard','patients','consultations','prescriptions','rendez-vous','medicaments','rapports'],
    canCreate: ['consultations','prescriptions','rendez-vous','patients'],
    canEdit:   ['consultations','prescriptions','patients'],
    canDelete: [],
  },
  RECEPTIONNISTE: {
    canView:   ['dashboard','patients','rendez-vous','caisse'],
    canCreate: ['patients','rendez-vous','caisse'],
    canEdit:   ['patients','rendez-vous'],
    canDelete: [],
  },
};

export function canAccess(role, page, action = 'canView') {
  const rolePerms = PERMISSIONS[role] || PERMISSIONS.RECEPTIONNISTE;
  if (action === 'canDelete' && rolePerms.canDelete.includes('*')) return true;
  return rolePerms[action]?.includes(page) ?? false;
}

export function filterPagesByRole(pages, role) {
  return pages.filter(p => canAccess(role, p.id));
}
