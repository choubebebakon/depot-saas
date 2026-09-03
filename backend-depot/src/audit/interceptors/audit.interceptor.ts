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

const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'refreshToken',
  'refreshTokenHash',
  'accessToken',
  'twoFASecret',
  'secret',
  'apiKey',
  'logo',
]);

function sanitizeAuditValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[profondeur masquée]';

  if (typeof value === 'string') {
    return value.length > 2_000 ? `${value.slice(0, 2_000)}…[tronqué]` : value;
  }

  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeAuditValue(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      key,
      REDACTED_KEYS.has(key) ? '[masqué]' : sanitizeAuditValue(child, depth + 1),
    ]),
  );
}

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

    if (!meta) return next.handle();

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
            valeurApres: sanitizeAuditValue(result),
          })
          .catch((err) => {
            console.error('[AuditInterceptor] Échec du log audit (succès):', err);
          });
      }),
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
              erreur: typeof err?.message === 'string' ? err.message.slice(0, 1_000) : 'erreur inconnue',
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
