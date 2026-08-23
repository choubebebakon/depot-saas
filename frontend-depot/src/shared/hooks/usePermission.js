import { useAuth } from '../../contexts/AuthContext';
import {
  normalizeMetierSlug,
  resolvePermission,
} from '../permissions/matrix';
import { hasRole, PERMISSIONS as RBAC_PERMISSIONS } from '../../utils/rbac';

const GRANULAR_METIERS = new Set(['supermarche', 'boutique', 'depot']);

const LEGACY_PERMISSION_MAP = {
  STOCK: { view: 'STOCK_READ', edit: 'STOCK_WRITE', delete: 'STOCK_WRITE' },
  SALES: { view: 'SALES_READ', edit: 'SALES_WRITE', delete: 'SALES_WRITE' },
  FINANCE: { view: 'FINANCE_READ', edit: 'FINANCE_WRITE', delete: 'FINANCE_WRITE' },
  EMPLOYEES: { view: 'EMPLOYEES_READ', edit: 'EMPLOYEES_WRITE', delete: 'EMPLOYEES_WRITE' },
};

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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
    const legacyPerms = LEGACY_PERMISSION_MAP[permissionsOrSousModule];
    if (legacyPerms) {
      const tokenPayload = decodeJwtPayload(localStorage.getItem('depot_token'));
      const legacyRole = tokenPayload?.role || user?.role || role;

      return {
        canView: hasRole(legacyRole, RBAC_PERMISSIONS[legacyPerms.view] || []),
        canEdit: hasRole(legacyRole, RBAC_PERMISSIONS[legacyPerms.edit] || []),
        canDelete: hasRole(legacyRole, RBAC_PERMISSIONS[legacyPerms.delete] || []),
        role: legacyRole,
      };
    }

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

export function usePermissions() {
  const { user } = useAuth();
  const tokenPayload = decodeJwtPayload(localStorage.getItem('depot_token'));
  const role = tokenPayload?.role || user?.role || null;
  const tenantId = tokenPayload?.tenantId || user?.tenantId || null;
  const depotId = tokenPayload?.depotId ?? user?.depotId ?? null;

  const can = (permission) => hasRole(role, RBAC_PERMISSIONS[permission] || []);
  const filterMenu = (items) =>
    items.filter((item) => !item.permission || can(item.permission));

  return {
    role,
    tenantId,
    depotId,
    can,
    filterMenu,
    canAccessAllDepots: can('TENANT_ALL_DEPOTS'),
    canReadStocks: can('STOCK_READ'),
    canWriteStocks: can('STOCK_WRITE'),
    canReadSales: can('SALES_READ'),
    canWriteSales: can('SALES_WRITE'),
    canReadFinance: can('FINANCE_READ'),
    canWriteFinance: can('FINANCE_WRITE'),
    canReadEmployees: can('EMPLOYEES_READ'),
    canWriteEmployees: can('EMPLOYEES_WRITE'),
  };
}
