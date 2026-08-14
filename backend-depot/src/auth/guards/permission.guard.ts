import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PermissionService } from '../permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const role = user?.role;

    if (!role) {
      throw this.denied('Patron ou Gérant');
    }

    const metier = await this.permissionService.resolveMetierSlug(
      user?.tenantId,
      req.params?.metier,
      user?.metier,
    );

    if (!metier) {
      throw this.denied('Patron ou Gérant');
    }

    const result = await this.permissionService.canAccess(
      role,
      metier,
      required.sousModule,
      required.action,
    );

    if (!result.allowed) {
      throw this.denied(result.libelleRoleAutorise);
    }

    return true;
  }

  private denied(libelleRoleAutorise: string): ForbiddenException {
    return new ForbiddenException({
      error: 'ACCESS_DENIED',
      message: `Accès refusé — cette partie est réservée à ${libelleRoleAutorise}.`,
    });
  }
}
