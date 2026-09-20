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
    userId?: string | null;
  };
}

const MULTI_DEPOT_ROLES = new Set(['PATRON']);

/**
 * Segments de routes qui n'ont pas besoin d'isolation par dépôt.
 * Ces routes sont soit globales (auth, platform-admin) soit déjà protégées
 * par leurs propres guards (SuperAdminGuard, etc.).
 * On vérifie dans originalUrl (contient le préfixe global) ET dans path
 * (NestJS peut omettre le préfixe dans certains contextes).
 */
const BYPASS_ROUTE_SEGMENTS = ['/auth/', '/platform/', '/super-admin/'];

function isBypassRoute(request: Request): boolean {
  // Utiliser originalUrl pour avoir le chemin complet incluant le préfixe global
  const fullPath = (request.originalUrl || request.path || '').toLowerCase();
  // Retirer les query strings pour la comparaison
  const pathOnly = fullPath.split('?')[0];

  return BYPASS_ROUTE_SEGMENTS.some(
    (segment) =>
      pathOnly.includes(segment) ||
      pathOnly.endsWith(segment.slice(0, -1)), // ex: /auth sans trailing slash
  );
}

function normalizeDepotId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || ['all', 'null', 'undefined'].includes(normalized))
    return null;
  return normalized;
}

function isClientRoute(request: Request): boolean {
  return /\/clients(?:\/|$)/i.test(request.path || request.originalUrl || '');
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

    // Pas d'utilisateur authentifié → laisser passer (les guards gèrent)
    if (!user) return next.handle();

    // Les SuperAdmins ont un accès global : aucune restriction de scope dépôt
    if ((user as any).isSuperAdmin === true) return next.handle();

    // Certaines routes (auth, platform, admin) n'ont pas de notion
    // d'isolation par dépôt : les exclure complètement de l'intercepteur
    if (isBypassRoute(request)) return next.handle();

    const requestedDepotId = this.getRequestedDepotId(request);

    return new Observable<unknown>((observer) => {
      let subscription: Subscription | undefined;

      void this.resolveDepotId(user, requestedDepotId)
        .then(async (depotId) => {
          const resolvedScope = {
            tenantId: user.tenantId,
            depotId,
            role: user.role,
            userId: user.userId,
          };

          request.depotScope = resolvedScope;
          this.applyAuthoritativeDepotScope(request, depotId);

          if (isClientRoute(request) && !depotId) {
            throw new ForbiddenException(
              'Un depot actif est requis pour acceder aux clients.',
            );
          }

          await this.assertClientTargetScope(request, user.tenantId, depotId);

          subscription = this.depotScope.run(
            {
              ...resolvedScope,
              requestId: (request as any).auditRequestId ?? null,
              metier: (request as any).auditMetier ?? null,
            },
            () =>
              next.handle().subscribe({
                next: (value: unknown) =>
                  observer.next(
                    this.filterClientResponse(request, value, depotId),
                  ),
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
    const header = normalizeDepotId(headerDepotId);
    const query = normalizeDepotId(request.query.depotId);
    const body = normalizeDepotId(
      (request.body as Record<string, unknown> | undefined)?.depotId,
    );

    const explicit = [header, query, body].filter((value): value is string =>
      Boolean(value),
    );
    if (new Set(explicit).size > 1) {
      throw new ForbiddenException(
        'Les identifiants de depot de la requete sont incoherents.',
      );
    }

    return header ?? query ?? body;
  }

  private applyAuthoritativeDepotScope(
    request: AuthenticatedRequest,
    depotId: string | null,
  ): void {
    if (depotId) {
      request.headers['x-depot-id'] = depotId;
    } else {
      delete request.headers['x-depot-id'];
    }

    const body = request.body as Record<string, unknown> | undefined;
    if (body && isClientRoute(request)) {
      if (depotId) body.depotId = depotId;
      else delete body.depotId;
    } else if (body && Object.prototype.hasOwnProperty.call(body, 'depotId')) {
      if (depotId) body.depotId = depotId;
      else delete body.depotId;
    }

    const query = request.query as Record<string, unknown> | undefined;
    if (query) {
      if (depotId) {
        // Pour les rôles mono-dépôt (notamment GERANT), on force query.depotId
        // même s'il n'était pas présent, pour éviter les agrégations globales non souhaitées.
        if (request.user?.role !== 'PATRON') {
          query.depotId = depotId;
        } else if (Object.prototype.hasOwnProperty.call(query, 'depotId')) {
          query.depotId = depotId;
        }
      } else {
        delete query.depotId;
      }
    }
  }

  private async assertClientTargetScope(
    request: AuthenticatedRequest,
    tenantId: string,
    depotId: string | null,
  ): Promise<void> {
    if (!isClientRoute(request) || !depotId) return;

    const method = request.method.toUpperCase();
    const clientId = request.params?.id;
    if (!clientId) return;

    if (!['GET', 'PATCH', 'PUT', 'DELETE', 'POST'].includes(method)) return;

    const client = await this.prisma.client.findFirst({
      where: { id: String(clientId), tenantId, depotId },
      select: { id: true },
    });

    if (!client)
      throw new ForbiddenException('Acces refuse a ce client dans ce depot.');
  }

  private filterClientResponse(
    request: AuthenticatedRequest,
    value: unknown,
    depotId: string | null,
  ): unknown {
    if (!isClientRoute(request) || !depotId || value == null) return value;

    if (Array.isArray(value)) {
      return value.filter((item: any) => item?.depotId === depotId);
    }

    if (typeof value === 'object') {
      const candidate = value as Record<string, any>;
      if (Array.isArray(candidate.data)) {
        return {
          ...candidate,
          data: candidate.data.filter((item: any) => item?.depotId === depotId),
        };
      }

      if (candidate.depotId && candidate.depotId !== depotId) {
        throw new ForbiddenException('Acces refuse a ce client dans ce depot.');
      }
    }

    return value;
  }

  private async resolveDepotId(
    user: AuthenticatedUser,
    requestedDepotId: string | null,
  ): Promise<string | null> {
    if (!user.tenantId) {
      throw new ForbiddenException('Contexte tenant invalide.');
    }

    // PATRON peut accéder à tous les dépôts de son tenant
    if (user.role === 'PATRON') {
      if (!requestedDepotId) {
        // Si aucun dépôt demandé, utiliser le dépôt par défaut de l'utilisateur s'il existe
        if (user.depotId) {
          await this.assertActiveDepotOwnership(user.tenantId, user.depotId);
          return user.depotId;
        }
        // Sinon, retourner null (accès multi-dépôts sans dépôt spécifique)
        return null;
      }
      // Si un dépôt est demandé, vérifier qu'il appartient au tenant
      await this.assertActiveDepotOwnership(user.tenantId, requestedDepotId);
      return requestedDepotId;
    }

    // Pour tous les autres rôles (GERANT, CAISSIER, MAGASINIER, COMMERCIAL,
    // COMPTABLE) : périmètre = dépôt par défaut ∪ affectations UserDepot
    // (§13 de la matrice d'accès : comptable central, gérant multi-sites).
    if (!user.depotId) {
      if (requestedDepotId) {
        throw new ForbiddenException(
          "Cet utilisateur n'est affecte a aucun depot.",
        );
      }
      return null;
    }

    if (requestedDepotId && requestedDepotId !== user.depotId) {
      // Autorisé uniquement si une affectation explicite UserDepot existe.
      const affectation = await this.prisma.userDepot.findFirst({
        where: {
          userId: user.userId,
          depotId: requestedDepotId,
          tenantId: user.tenantId,
        },
        select: { id: true },
      });
      if (!affectation) {
        throw new ForbiddenException('Acces refuse a ce depot.');
      }
    }

    await this.assertActiveDepotOwnership(
      user.tenantId,
      requestedDepotId ?? user.depotId,
    );
    return requestedDepotId ?? user.depotId;
  }

  private async assertActiveDepotOwnership(
    tenantId: string,
    depotId: string,
  ): Promise<void> {
    const depot = await this.prisma.depot.findFirst({
      where: {
        id: depotId,
        tenantId,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!depot) {
      throw new ForbiddenException('Accès refusé à ce dépôt.');
    }
  }
}
