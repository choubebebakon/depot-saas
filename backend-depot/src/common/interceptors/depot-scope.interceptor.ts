import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { CallHandler as NestCallHandler } from '@nestjs/common';
import { Request } from 'express';
import { Observable, Subscription } from 'rxjs';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { DepotScopeService } from '../depot-scope.service';
import { PrismaService } from '../../prisma.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const MULTI_DEPOT_ROLES = new Set(['PATRON', 'GERANT']);

function normalizeDepotId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized === 'all' || normalized === 'null' || normalized === 'undefined') {
    return null;
  }
  return normalized;
}

@Injectable()
export class DepotScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly depotScope: DepotScopeService,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: NestCallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const requestedDepotId = this.getRequestedDepotId(request);

    return new Observable<unknown>((observer) => {
      let subscription: Subscription | undefined;

      void this.resolveDepotId(user, requestedDepotId)
        .then((depotId) => {
          subscription = this.depotScope.run(
            {
              tenantId: user.tenantId,
              depotId,
              role: user.role,
              requestId: (request as any).auditRequestId ?? null,
              metier: (request as any).auditMetier ?? null,
            },
            () =>
              next.handle().subscribe({
                next: (value: unknown) => observer.next(value),
                error: (error: unknown) => observer.error(error),
                complete: () => observer.complete(),
              }),
          );
        })
        .catch((error) => observer.error(error));

      return () => subscription?.unsubscribe();
    });
  }

  private getRequestedDepotId(request: Request): string | null {
    const headerDepotId = Array.isArray(request.headers['x-depot-id'])
      ? request.headers['x-depot-id'][0]
      : request.headers['x-depot-id'];

    return normalizeDepotId(headerDepotId ?? request.query.depotId);
  }

  private async resolveDepotId(
    user: AuthenticatedUser,
    requestedDepotId: string | null,
  ): Promise<string | null> {
    // Un utilisateur affecté à un dépôt ne peut jamais changer de dépôt via
    // un header/query falsifiable. Son scope reste celui du JWT.
    if (!MULTI_DEPOT_ROLES.has(user.role)) {
      if (!user.depotId) {
        if (requestedDepotId) {
          throw new ForbiddenException('Cet utilisateur n’est affecté à aucun dépôt.');
        }
        return null;
      }

      if (requestedDepotId && requestedDepotId !== user.depotId) {
        throw new ForbiddenException('Accès refusé à ce dépôt.');
      }

      return user.depotId;
    }

    // PATRON/GERANT peuvent changer de dépôt, mais uniquement à l'intérieur
    // de leur propre tenant. Un dépôt d'un autre tenant est systématiquement
    // refusé, même si son UUID est connu.
    if (!requestedDepotId) {
      return user.depotId ?? null;
    }

    const depot = await this.prisma.depot.findFirst({
      where: {
        id: requestedDepotId,
        tenantId: user.tenantId,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!depot) {
      throw new ForbiddenException('Accès refusé à ce dépôt.');
    }

    return depot.id;
  }
}
