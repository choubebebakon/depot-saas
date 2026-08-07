import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditMeta } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.getAllAndOverride<AuditMeta>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params ?? {};

    return next.handle().pipe(
      tap((result) => {
        this.auditService
          .logEvent({
            tenantId: user?.tenantId,
            depotId: user?.depotId ?? null,
            actorUserId: user?.userId ?? null,
            actorEmail: user?.email ?? null,
            actorRole: user?.role ?? null,
            action: meta.action,
            targetType: meta.targetType,
            targetId: params.id ?? result?.id ?? null,
            description: `${meta.action} sur ${meta.targetType}${params.id ? ' #' + params.id : ''}`,
            valeurApres: result ?? null,
            ipAddress: request.ip ?? null,
            userAgent: request.headers?.['user-agent'] ?? null,
          })
          .catch((err) => {
            // Un échec de log d'audit ne doit jamais faire échouer la requête métier
            console.error('[AuditInterceptor] Échec du log audit:', err);
          });
      }),
    );
  }
}
