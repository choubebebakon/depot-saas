import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard pour la validation des refresh tokens via la strategie JwtRefreshStrategy.
 * Utilise pour proteger l'endpoint POST /auth/refresh.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Ignore l'authentification uniquement pour les routes marquees @Public().
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context) as boolean | Promise<boolean> | Observable<boolean>;
  }
}
