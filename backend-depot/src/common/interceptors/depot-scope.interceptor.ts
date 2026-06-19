import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
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

  /**
   * Injecte le tenant authentifié dans le contexte AsyncLocalStorage de la requête.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Si pas d'utilisateur (ex: route publique), on passe directement sans scoping
    if (!user) {
      return next.handle();
    }

    return new Observable<unknown>((observer) => {
      // On capture la souscription retournée à l'intérieur du callback de l'ALS
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

      // 🔥 Sécurité RxJS : Si la requête est annulée par le client, on se désabonne 
      // pour libérer instantanément les ressources et connexions de la base de données.
      return () => {
        if (subscription instanceof Subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }

  /**
   * Extrait le dépôt demandé sans faire confiance à ce champ pour l'isolation tenant.
   */
  private getRequestedDepotId(request: Request): string | null {
    const rawDepotId = request.headers['x-depot-id'] ?? request.query.depotId;

    if (typeof rawDepotId !== 'string' || rawDepotId.trim() === '' || rawDepotId === 'all') {
      return null;
    }

    return rawDepotId;
  }
}