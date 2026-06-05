import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { DepotScopeService } from '../depot-scope.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class DepotScopeInterceptor implements NestInterceptor {
  constructor(private readonly depotScope: DepotScopeService) {}

  /**
   * Injecte le tenant authentifie dans le contexte AsyncLocalStorage de la requete.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    return new Observable<unknown>((observer) => {
      this.depotScope.run(
        {
          tenantId: user.tenantId,
          depotId: this.getRequestedDepotId(request),
          role: user.role,
        },
        () => {
          next.handle().subscribe({
            next: (value: unknown) => observer.next(value),
            error: (error: unknown) => observer.error(error),
            complete: () => observer.complete(),
          });
        },
      );
    });
  }

  /**
   * Extrait le depot demande sans faire confiance a ce champ pour l'isolation tenant.
   */
  private getRequestedDepotId(request: Request): string | null {
    const rawDepotId = request.headers['x-depot-id'] ?? request.query.depotId;

    if (typeof rawDepotId !== 'string' || rawDepotId.trim() === '' || rawDepotId === 'all') {
      return null;
    }

    return rawDepotId;
  }
}
