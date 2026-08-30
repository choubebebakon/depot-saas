import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditSeverite } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

    const baseEntry = {
      tenantId: user?.tenantId,
      depotId: user?.depotId ?? null,
      actorUserId: user?.userId ?? null,
      actorEmail: user?.email ?? null,
      actorRole: user?.role ?? null,
      action: meta.action,
      targetType: meta.targetType,
      ipAddress: request.ip ?? null,
      userAgent: request.headers?.['user-agent'] ?? null,
    };

    return next.handle().pipe(
      tap((result) => {
        this.auditService
          .logEvent({
            ...baseEntry,
            targetId: params.id ?? result?.id ?? null,
            description: `${meta.action} sur ${meta.targetType}${params.id ? ' #' + params.id : ''}`,
            valeurApres: result ?? null,
          })
          .catch((err) => {
            // Un échec de log d'audit ne doit jamais faire échouer la requête métier
            console.error('[AuditInterceptor] Échec du log audit (succès):', err);
          });
      }),
      // Avant ce correctif : seul tap() était utilisé, donc un refus/échec
      // métier (403, validation, exception) ne laissait AUCUNE trace dans
      // le journal patron. Une tentative bloquée est pourtant une
      // information de sécurité au moins aussi importante qu'un succès.
      catchError((err) => {
        this.auditService
          .logEvent({
            ...baseEntry,
            severite: AuditSeverite.ATTENTION,
            targetId: params.id ?? null,
            description: `Échec — ${meta.action} sur ${meta.targetType}${
              params.id ? ' #' + params.id : ''
            } : ${err?.message ?? 'erreur inconnue'}`,
            valeurApres: null,
            metadata: {
              statusCode: err?.status ?? err?.statusCode ?? null,
              erreur: err?.message ?? String(err),
            },
          })
          .catch((logErr) => {
            console.error('[AuditInterceptor] Échec du log audit (échec):', logErr);
          });
        return throwError(() => err);
      }),
    );
  }
}