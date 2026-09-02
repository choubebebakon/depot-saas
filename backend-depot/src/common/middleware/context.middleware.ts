import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

const METIER_PREFIXES = new Set([
  'boutique',
  'supermarche',
  'depot-boissons',
]);

function extractMetierFromPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('v1');
  const candidate = apiIndex >= 0 ? segments[apiIndex + 1] : segments[0];
  return candidate && METIER_PREFIXES.has(candidate) ? candidate : null;
}

/**
 * Middleware volontairement limité aux métadonnées techniques de requête.
 *
 * IMPORTANT : ce middleware s'exécute avant les Guards. Il ne doit donc jamais
 * placer dans DepotScopeService une identité issue d'un JWT non vérifié.
 * L'identité authentifiée et le scope tenant/dépôt sont établis plus tard,
 * après JwtAuthGuard, par les interceptors de scope.
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    (req as any).auditRequestId = randomUUID();
    (req as any).auditMetier = extractMetierFromPath(req.path);
    next();
  }
}
