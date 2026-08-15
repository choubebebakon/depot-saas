import { useAuth } from '../../contexts/AuthContext';
import { resolvePermission } from './matrix';

/**
 * Hook granulaire : usePermission(sousModule) → { canRead, canWrite, libelleRoleAutorise, libellePoste }
 * Branché sur AuthContext (role, metier, permissions API).
 */
export function usePermission(sousModule) {
  const { role, metier, permissionsState, libellePoste } = useAuth();

  const result = resolvePermission(
    role,
    metier || localStorage.getItem('gestock_metier'),
    sousModule,
    permissionsState,
  );

  return {
    canRead: result.canRead,
    canWrite: result.canWrite,
    libelleRoleAutorise: result.libelleRoleAutorise,
    libellePoste: libellePoste || result.libellePoste,
  };
}

export default usePermission;
