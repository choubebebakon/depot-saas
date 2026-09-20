import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'read' | 'write';

export interface RequiredPermission {
  sousModule: string;
  action: PermissionAction;
}

export const PERMISSION_KEY = 'required_permission';

export const RequirePermission = (
  sousModule: string,
  action: PermissionAction,
) =>
  SetMetadata(PERMISSION_KEY, {
    sousModule,
    action,
  } satisfies RequiredPermission);

// ── §14 : permission d'action fine ─────────────────────────────────────────
// Distingue les actions sensibles d'une écriture normale :
//   ventes.annuler, caisse.fermer, caisse.depense, stock.ajuster,
//   stock.transfert, remise.accorder, prix.modifier…
// Deny-by-default via la table ActionPermission (PATRON/GERANT autorisés
// en code). Combinable avec @RequirePermission sur la même route.
export const ACTION_KEY = 'required_action';

export const RequireAction = (action: string) =>
  SetMetadata(ACTION_KEY, action);
