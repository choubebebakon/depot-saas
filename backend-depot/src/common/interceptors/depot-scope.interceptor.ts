import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, Subscription } from 'rxjs';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { DepotScopeService } from '../depot-scope.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class DepotScopeInterceptor implements NestInterceptor {
  constructor(private readonly depotScope: DepotScopeService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 👈 SÉCURITÉ : On ignore les routes d'authentification pour éviter les blocages
    // lors de la création d'un utilisateur ou de la connexion.
    const publicRoutes = [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
    ];
    if (publicRoutes.includes(request.url)) {
      return next.handle();
    }

    const user = request.user;

    // Si pas d'utilisateur (ex: route protégée mais sans user), on passe sans scoping
    if (!user) {
      return next.handle();
    }

    return new Observable<unknown>((observer) => {
      const subscription = this.depotScope.run(
        {
          tenantId: user.tenantId,
          depotId: this.getRequestedDepotId(request),
          role: user.role,
        },
        () => {
          return next.handle().subscribe({
            next: (value: unknown) => observer.next(value),
            error: (error: unknown) => observer.error(error),
            complete: () => observer.complete(),
          });
        },
      );

      return () => {
        if (subscription instanceof Subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }

  private getRequestedDepotId(request: Request): string | null {
    const rawDepotId = request.headers['x-depot-id'] ?? request.query.depotId;

    if (
      typeof rawDepotId !== 'string' ||
      rawDepotId.trim() === '' ||
      rawDepotId === 'all'
    ) {
      return null;
    }

    return rawDepotId;
  }
}
