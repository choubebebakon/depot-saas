import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ACTION_KEY,
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

    // §14 : contrôle d'action fine (ventes.annuler, caisse.fermer…),
    // évalué en complément — ou en l'absence — de la permission read/write.
    const requiredAction = this.reflector.getAllAndOverride<string>(
      ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required && !requiredAction) return true;

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

    if (required) {
      const result = await this.permissionService.canAccess(
        role,
        metier,
        required.sousModule,
        required.action,
      );

      if (!result.allowed) {
        throw this.denied(result.libelleRoleAutorise);
      }
    }

    if (requiredAction) {
      const allowed = await this.permissionService.canPerformAction(
        role,
        metier,
        requiredAction,
      );
      if (!allowed) {
        throw new ForbiddenException({
          error: 'ACTION_DENIED',
          message: `Action refusée — « ${requiredAction} » n'est pas accordée à votre rôle sur ce métier. Contactez votre gérant.`,
        });
      }
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
