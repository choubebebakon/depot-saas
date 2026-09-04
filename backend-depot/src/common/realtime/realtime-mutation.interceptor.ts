import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DepotScopeService } from '../depot-scope.service';
import { RealtimeService } from './realtime.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class RealtimeMutationInterceptor implements NestInterceptor {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly depotScope: DepotScopeService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<any>();
    const method = String(request.method ?? '').toUpperCase();

    if (!MUTATING_METHODS.has(method)) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const user = request.user;
        const tenantId = typeof user?.tenantId === 'string' ? user.tenantId : this.depotScope.getTenantId();
        if (!tenantId) return;

        const path = this.normalizePath(request.originalUrl || request.url || '');
        const resource = this.resourceFromPath(path);
        const action = this.actionFromMethod(method);
        const depotId = this.depotScope.getDepotId() ?? (typeof user?.depotId === 'string' ? user.depotId : null);

        this.realtime.publish({
          type: 'api.mutation',
          resource,
          action,
          tenantId,
          depotId,
          actorUserId: typeof user?.userId === 'string' ? user.userId : null,
          occurredAt: new Date().toISOString(),
          payload: { method, path },
        });
      }),
    );
  }

  private normalizePath(path: string): string {
    const clean = path.split('?')[0].replace(/^\/+|\/+$/g, '');
    return clean.replace(/^api\/v\d+\/?/i, '');
  }

  private resourceFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'unknown';
    return segments.slice(0, 2).join(':').toLowerCase();
  }

  private actionFromMethod(method: string): 'created' | 'updated' | 'deleted' | 'changed' {
    if (method === 'POST') return 'created';
    if (method === 'DELETE') return 'deleted';
    if (method === 'PUT' || method === 'PATCH') return 'updated';
    return 'changed';
  }
}
