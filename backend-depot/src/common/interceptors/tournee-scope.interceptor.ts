import { ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, Subscription } from 'rxjs';
import { PrismaService } from '../../prisma.service';
import { DepotScopeService } from '../depot-scope.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

interface ScopedRequest extends Request {
  user?: AuthenticatedUser;
  depotScope?: { tenantId: string; depotId: string | null; role: string };
}

const MULTI_DEPOT_ROLES = new Set(['PATRON', 'GERANT']);

function normalize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v && v !== 'all' && v !== 'null' && v !== 'undefined' ? v : null;
}
function routePath(request: Request): string { return (request.path || request.originalUrl || '').split('?')[0]; }
function isTourneeRoute(request: Request): boolean { return /\/depot-boissons\/tournees(?:\/|$)/i.test(routePath(request)) || /\/tournees(?:\/|$)/i.test(routePath(request)); }
function isTricycleRoute(request: Request): boolean { return /\/tournees\/tricycles(?:\/|$)/i.test(routePath(request)); }

@Injectable()
export class TourneeScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService, private readonly depotScope: DepotScopeService) {}

  intercept(context: ExecutionContext, next: import('@nestjs/common').CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;
    if (!user || !isTourneeRoute(request)) return next.handle();

    return new Observable((observer) => {
      let subscription: Subscription | undefined;
      void this.resolveDepot(user, request)
        .then(async (depotId) => {
          if (!depotId) throw new ForbiddenException('Un dépôt actif est requis pour gérer les tournées.');
          request.depotScope = { tenantId: user.tenantId, depotId, role: user.role };
          this.forceAuthoritativeScope(request, user.tenantId, depotId);
          if (!isTricycleRoute(request)) await this.assertTourneeTarget(request, user.tenantId, depotId);
          subscription = this.depotScope.run(
            { tenantId: user.tenantId, depotId, role: user.role, requestId: (request as any).auditRequestId ?? null, metier: (request as any).auditMetier ?? 'DEPOT_BOISSONS' },
            () => next.handle().subscribe({ next: (value) => observer.next(value), error: (error) => observer.error(error), complete: () => observer.complete() }),
          );
        })
        .catch((error) => observer.error(error));
      return () => subscription?.unsubscribe();
    });
  }

  private async resolveDepot(user: AuthenticatedUser, request: Request): Promise<string | null> {
    const header = Array.isArray(request.headers['x-depot-id']) ? request.headers['x-depot-id'][0] : request.headers['x-depot-id'];
    const requested = normalize(header ?? request.query.depotId);

    if (!MULTI_DEPOT_ROLES.has(user.role)) {
      if (!user.depotId) {
        if (requested) throw new ForbiddenException('Cet utilisateur n’est affecté à aucun dépôt.');
        return null;
      }
      if (requested && requested !== user.depotId) throw new ForbiddenException('Accès refusé à ce dépôt.');
      return user.depotId;
    }

    if (!requested) return user.depotId ?? null;
    const depot = await this.depotScope.run(
      { tenantId: user.tenantId, depotId: null, role: user.role },
      () => this.prisma.depot.findFirst({ where: { id: requested, tenantId: user.tenantId, isArchived: false }, select: { id: true } }),
    );
    if (!depot) throw new ForbiddenException('Accès refusé à ce dépôt.');
    return depot.id;
  }

  private forceAuthoritativeScope(request: ScopedRequest, tenantId: string, depotId: string): void {
    const body = request.body as Record<string, unknown> | undefined;
    if (body) { body.tenantId = tenantId; body.depotId = depotId; }
    const query = request.query as Record<string, unknown> | undefined;
    if (query) { query.tenantId = tenantId; query.depotId = depotId; }
  }

  private async assertTourneeTarget(request: Request, tenantId: string, depotId: string): Promise<void> {
    const id = request.params?.id || (request.body as any)?.tourneeId;
    if (!id) return;
    const tournee = await this.prisma.tournee.findFirst({ where: { id, tenantId, depotId }, select: { id: true } });
    if (!tournee) throw new ForbiddenException('Accès refusé à cette tournée dans ce dépôt.');
  }
}
