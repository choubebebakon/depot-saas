import { useAuth } from '../../contexts/AuthContext';
import {
  normalizeMetierSlug,
  resolvePermission,
} from '../permissions/matrix';

const GRANULAR_METIERS = new Set(['supermarche', 'boutique', 'depot']);

/**
 * Compatible deux signatures :
 * - usePermission('stock') → { canRead, canWrite, libelleRoleAutorise }
 * - usePermission(PERMISSIONS, 'stock') → { canView, canCreate, canEdit, canDelete, ... }
 *   Pour supermarche/boutique/depot : délègue à la matrice granulaire (canWrite → create/edit/delete).
 *   Pour les autres métiers : conserve l'ancienne matrice locale PERMISSIONS.
 */
export function usePermission(permissionsOrSousModule, page) {
  const { user, role: ctxRole, metier, permissionsState, libellePoste } =
    useAuth();
  const role = ctxRole || user?.role || 'CAISSIER';
  const rawMetier = metier || user?.metier || localStorage.getItem('gestock_metier');
  const slug = normalizeMetierSlug(rawMetier);

  // Nouvelle API : usePermission(sousModule)
  if (typeof permissionsOrSousModule === 'string') {
    const result = resolvePermission(
      role,
      rawMetier,
      permissionsOrSousModule,
      permissionsState,
    );
    return {
      canRead: result.canRead,
      canWrite: result.canWrite,
      libelleRoleAutorise: result.libelleRoleAutorise,
      libellePoste: libellePoste || result.libellePoste,
      // aliases pour transition
      canView: result.canRead,
      canCreate: result.canWrite,
      canEdit: result.canWrite,
      canDelete: result.canWrite,
      role,
    };
  }

  const sousModule = page;

  // 3 métiers cibles : matrice granulaire (ignore PERMISSIONS locales obsolètes)
  if (slug && GRANULAR_METIERS.has(slug) && sousModule) {
    const result = resolvePermission(
      role,
      rawMetier,
      sousModule,
      permissionsState,
    );
    return {
      canView: result.canRead,
      canCreate: result.canWrite,
      canEdit: result.canWrite,
      canDelete: result.canWrite,
      canRead: result.canRead,
      canWrite: result.canWrite,
      libelleRoleAutorise: result.libelleRoleAutorise,
      libellePoste: libellePoste || result.libellePoste,
      role,
    };
  }

  // Autres métiers : ancienne matrice locale
  const permissions = permissionsOrSousModule;
  const rolePerms =
    permissions?.[role] ||
    permissions?.CAISSIER || {
      canView: [],
      canCreate: [],
      canEdit: [],
      canDelete: [],
    };

  const wildcard = rolePerms.canDelete?.includes('*');

  return {
    canView: wildcard || rolePerms.canView?.includes(page),
    canCreate: wildcard || rolePerms.canCreate?.includes(page),
    canEdit: wildcard || rolePerms.canEdit?.includes(page),
    canDelete: wildcard || rolePerms.canDelete?.includes(page),
    role,
  };
}
