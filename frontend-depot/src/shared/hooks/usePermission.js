import { useAuth } from '../../contexts/AuthContext';

export function usePermission(permissions, page) {
  const { user } = useAuth();
  const role = user?.role || 'CAISSIER';
  const rolePerms = permissions?.[role] || permissions?.CAISSIER || { canView: [], canCreate: [], canEdit: [], canDelete: [] };

  return {
    canView: rolePerms.canDelete?.includes('*') || rolePerms.canView?.includes(page),
    canCreate: rolePerms.canDelete?.includes('*') || rolePerms.canCreate?.includes(page),
    canEdit: rolePerms.canDelete?.includes('*') || rolePerms.canEdit?.includes(page),
    canDelete: rolePerms.canDelete?.includes('*') || rolePerms.canDelete?.includes(page),
    role,
  };
}
