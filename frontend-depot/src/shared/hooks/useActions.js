import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hook d'accès aux permissions d'ACTION fines (§14 de la matrice GesTock).
 *
 * Les actions sensibles sont vérifiées côté serveur (guard @RequireAction),
 * ce hook sert uniquement à masquer/désactiver les boutons dans l'UI :
 *   - annuler une vente        → 'ventes.annuler'
 *   - ajuster le stock         → 'stock.ajuster'
 *   - transférer du stock      → 'stock.transferer'
 *   - signaler une avarie      → 'stock.avarie'
 *   - enregistrer une dépense  → 'caisse.depense'
 *   - ouvrir la caisse         → 'caisse.ouvrir'
 *   - fermer la caisse         → 'caisse.fermer'
 *
 * Source de vérité : GET /auth/permissions → { actions, actionsFullAccess }.
 * PATRON et GERANT ont actionsFullAccess = true (toutes les actions).
 *
 * @returns {{ actions: string[], actionsFullAccess: boolean, hasAction: (action: string) => boolean }}
 */
export function useActions() {

  const { user, permissionsState } = useAuth();

  const actions = useMemo(() => {
    const list =
      permissionsState?.actions ||
      user?.actions ||
      user?.permissions?.actions ||
      [];
    return Array.isArray(list) ? list : [];
  }, [permissionsState?.actions, user?.actions, user?.permissions?.actions]);

  const actionsFullAccess = useMemo(() => {
    if (permissionsState?.actionsFullAccess !== undefined) {
      return !!permissionsState.actionsFullAccess;
    }
    const role = user?.role;
    return role === 'PATRON' || role === 'ADMIN' || role === 'GERANT' || role === 'SUPERADMIN';
  }, [permissionsState?.actionsFullAccess, user?.role]);

  const hasAction = useMemo(
    () => (action) => {
      if (!action) return true;
      if (actionsFullAccess) return true;
      return actions.includes(action);
    },
    [actions, actionsFullAccess],
  );

  return { actions, actionsFullAccess, hasAction };
}

export default useActions;
