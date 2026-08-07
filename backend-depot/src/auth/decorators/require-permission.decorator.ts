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
) => SetMetadata(PERMISSION_KEY, { sousModule, action } satisfies RequiredPermission);
