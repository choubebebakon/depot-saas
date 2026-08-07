import { Role } from '@prisma/client';

export type ModulePermission =
  | 'POS'
  | 'VENTES'
  | 'STOCKS'
  | 'INVENTAIRE'
  | 'COMPTABILITE'
  | 'ADMIN'
  | 'ALL';

export const RolePermissions: Record<Role, ModulePermission[]> = {
  [Role.PATRON]: ['ALL'],
  [Role.GERANT]: ['ALL'],
  [Role.CAISSIER]: ['POS', 'VENTES'],
  [Role.MAGASINIER]: ['STOCKS', 'INVENTAIRE'],
  [Role.COMMERCIAL]: ['VENTES'],
  [Role.COMPTABLE]: ['COMPTABILITE'],
  [Role.ADMIN]: ['ADMIN', 'ALL'],
};

