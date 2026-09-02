import { ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

interface ScopedRequest extends Request {
  user?: AuthenticatedUser;
  depotScope?: { tenantId: string; depotId: string | null; role: string };
}

/**
 * Les routes de tournées legacy utilisent exactement le même scope que le
 * reste de l'API. Le nouveau workflow /tournee-workflow est déjà protégé par
 * DepotScopeInterceptor et son propre controller/service.
 */
function routePath(request: Request): string {
  return (request.path || request.originalUrl || '').split('?')[0];
}

function isLegacyTourneeRoute(request: Request): boolean {
  const path = routePath(request).toLowerCase();
  return /\/depot-boissons\/tournees(?:\/|$)/.test(path) || /\/tournees(?:\/|$)/.test(path);
}

function isTricycleRoute(request: Request): boolean {
  return /\/tournees\/tricycles(?:\/|$)/i.test(routePath(request));
}

@Injectable()
export class TourneeScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: import('@nestjs/common').CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;

    if (!user || !isLegacyTourneeRoute(request)) return next.handle();

    const scope = request.depotScope;
    if (!scope?.tenantId || !scope.depotId) {
      throw new ForbiddenException('Un dépôt actif est requis pour gérer les tournées.');
    }

    // Ne relit plus X-Depot-Id / query.depotId et ne résout plus un dépôt à
    // partir du rôle. DepotScopeInterceptor a déjà effectué cette décision
    // après authentification et vérifié tenant + dépôt actif.
    this.forceAuthoritativeScope(request, scope.tenantId, scope.depotId);

    const targetCheck = isTricycleRoute(request)
      ? Promise.resolve()
      : this.assertTourneeTarget(request, scope.tenantId, scope.depotId);

    return from(targetCheck).pipe(switchMap(() => next.handle()));
  }

  private forceAuthoritativeScope(request: ScopedRequest, tenantId: string, depotId: string): void {
    const body = request.body as Record<string, unknown> | undefined;
    if (body) {
      body.tenantId = tenantId;
      body.depotId = depotId;
    }

    const query = request.query as Record<string, unknown> | undefined;
    if (query) {
      query.tenantId = tenantId;
      query.depotId = depotId;
    }
  }

  private async assertTourneeTarget(
    request: Request,
    tenantId: string,
    depotId: string,
  ): Promise<void> {
    const id = request.params?.id || (request.body as any)?.tourneeId;
    if (!id) return;

    const tournee = await this.prisma.tournee.findFirst({
      where: { id, tenantId, depotId },
      select: { id: true },
    });

    if (!tournee) {
      throw new ForbiddenException('Accès refusé à cette tournée dans ce dépôt.');
    }
  }
}
