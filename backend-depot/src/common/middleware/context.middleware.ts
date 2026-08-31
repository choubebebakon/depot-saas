import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { DepotScopeService } from '../depot-scope.service';
import * as jwt from 'jsonwebtoken';

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

function cleanScopeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined' || normalized === 'all') {
    return null;
  }
  return normalized;
}

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly depotScope: DepotScopeService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    let tenantId: string | null = null;
    let depotId: string | null = null;
    let role: string | null = null;

    // Le middleware ne sert qu'à préparer le contexte avant les Guards.
    // Le JWT est décodé ici (sans prétendre le vérifier) ; la vérification
    // cryptographique et l'utilisateur définitif viennent de JwtAuthGuard.
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const decoded = jwt.decode(token) as Record<string, unknown> | null;
        tenantId = cleanScopeValue(decoded?.tenantId);
        depotId = cleanScopeValue(decoded?.depotId);
        role = cleanScopeValue(decoded?.role);
      } catch {
        // JwtAuthGuard rejettera ensuite le token invalide.
      }
    }

    // IMPORTANT : x-tenant-id et x-depot-id ne sont jamais une source
    // d'identité. Un client peut les falsifier. L'identité tenant/depot de
    // base vient du JWT ; le changement de dépôt sera validé après le Guard
    // dans DepotScopeInterceptor.
    const requestId = randomUUID();
    (req as any).auditRequestId = requestId;
    const metier = extractMetierFromPath(req.path);
    (req as any).auditMetier = metier;

    this.depotScope.run({ tenantId, depotId, role, requestId, metier }, () => {
      next();
    });
  }
}
