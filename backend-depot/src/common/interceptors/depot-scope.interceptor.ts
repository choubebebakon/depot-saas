import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, Subscription } from 'rxjs';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma.service';
import { DepotScopeService } from '../depot-scope.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  depotScope?: {
    tenantId: string;
    depotId: string | null;
    role: string;
  };
}

const MULTI_DEPOT_ROLES = new Set(['PATRON', 'GERANT']);

function normalizeDepotId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (
    !normalized ||
    normalized === 'all' ||
    normalized === 'null' ||
    normalized === 'undefined'
  ) {
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

  intercept(
    context: ExecutionContext,
    next: import('@nestjs/common').CallHandler,
  ): Observable<unknown> {
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
          const resolvedScope = {
            tenantId: user.tenantId,
            depotId,
            role: user.role,
          };

          // Expose the already validated scope to controllers/services without
          // creating a second DepotScopeService/AsyncLocalStorage instance in
          // feature modules.
          request.depotScope = resolvedScope;

          // The authenticated server-side scope is authoritative. Controllers
          // historically accepted depotId from request bodies/query params;
          // normalize those values here so a client cannot silently override
          // the validated depot selected by the scope layer.
          this.applyAuthoritativeDepotScope(request, depotId);

          subscription = this.depotScope.run(
            {
              ...resolvedScope,
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

  private applyAuthoritativeDepotScope(
    request: AuthenticatedRequest,
    depotId: string | null,
  ): void {
    const body = request.body as Record<string, unknown> | undefined;
    if (body && Object.prototype.hasOwnProperty.call(body, 'depotId')) {
      if (depotId) {
        body.depotId = depotId;
      } else {
        delete body.depotId;
      }
    }

    const query = request.query as Record<string, unknown> | undefined;
    if (query && Object.prototype.hasOwnProperty.call(query, 'depotId')) {
      if (depotId) {
        query.depotId = depotId;
      } else {
        delete query.depotId;
      }
    }
  }

  private async resolveDepotId(
    user: AuthenticatedUser,
    requestedDepotId: string | null,
  ): Promise<string | null> {
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

    if (!requestedDepotId) {
      return user.depotId ?? null;
    }

    const depot = await this.depotScope.run(
      {
        tenantId: user.tenantId,
        depotId: null,
        role: user.role,
      },
      () =>
        this.prisma.depot.findFirst({
          where: {
            id: requestedDepotId,
            tenantId: user.tenantId,
            isArchived: false,
          },
          select: { id: true },
        }),
    );

    if (!depot) {
      throw new ForbiddenException('Accès refusé à ce dépôt.');
    }

    return depot.id;
  }
}
