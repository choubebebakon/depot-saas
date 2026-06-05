import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasRole, PERMISSIONS } from '../utils/rbac';

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
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const PERMISSION_MAP = {
  STOCK: { view: 'STOCK_READ', edit: 'STOCK_WRITE', delete: 'STOCK_WRITE' },
  SALES: { view: 'SALES_READ', edit: 'SALES_WRITE', delete: 'SALES_WRITE' },
  FINANCE: { view: 'FINANCE_READ', edit: 'FINANCE_WRITE', delete: 'FINANCE_WRITE' },
  EMPLOYEES: { view: 'EMPLOYEES_READ', edit: 'EMPLOYEES_WRITE', delete: 'EMPLOYEES_WRITE' },
};

/**
 * Vérifie les permissions pour une clé donnée.
 * @param {string} permissionKey - Clé de permission ('STOCK', 'SALES', etc.)
 * @returns {{ canView: boolean, canEdit: boolean, canDelete: boolean }}
 */
export function usePermission(permissionKey) {
  const { user } = useAuth();

  return useMemo(() => {
    const tokenPayload = decodeJwtPayload(localStorage.getItem('depot_token'));
    const role = tokenPayload?.role || user?.role || null;

    const perms = PERMISSION_MAP[permissionKey];
    if (!perms) {
      return { canView: false, canEdit: false, canDelete: false };
    }

    return {
      canView: hasRole(role, PERMISSIONS[perms.view] || []),
      canEdit: hasRole(role, PERMISSIONS[perms.edit] || []),
      canDelete: hasRole(role, PERMISSIONS[perms.delete] || []),
    };
  }, [permissionKey, user]);
}

export default usePermission;
