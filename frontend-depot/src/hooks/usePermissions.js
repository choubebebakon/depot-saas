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
  } catch (error) {
    console.warn('JWT illisible pour les permissions frontend:', error);
    return null;
  }
}

export function usePermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    const tokenPayload = decodeJwtPayload(localStorage.getItem('depot_token'));
    const role = tokenPayload?.role || user?.role || null;
    const tenantId = tokenPayload?.tenantId || user?.tenantId || null;
    const depotId = tokenPayload?.depotId ?? user?.depotId ?? null;

    const can = (permission) => hasRole(role, PERMISSIONS[permission] || []);
    const filterMenu = (items) => items.filter((item) => !item.permission || can(item.permission));

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
  }, [user]);
}
