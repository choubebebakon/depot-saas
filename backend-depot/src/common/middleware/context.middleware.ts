import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { DepotScopeService } from '../depot-scope.service';
import * as jwt from 'jsonwebtoken';

// Préfixes de controller connus des métiers actifs — sert uniquement à
// alimenter le champ "metier" du Journal Audit, ne remplace pas
// metier-slug.middleware (routage réel, alias legacy inclus).
const METIER_PREFIXES = new Set([
  'boutique',
  'supermarche',
  'depot-boissons',
]);

function extractMetierFromPath(path: string): string | null {
  // path type : /api/v1/boutique/ventes → segments ['api','v1','boutique','ventes']
  const segments = path.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('v1');
  const candidate = apiIndex >= 0 ? segments[apiIndex + 1] : segments[0];
  return candidate && METIER_PREFIXES.has(candidate) ? candidate : null;
}

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly depotScope: DepotScopeService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    let tenantId: string | null = null;
    let depotId: string | null = null;
    let role: string | null = null;

    // 1. Extraction depuis le Token JWT (Prioritaire pour l'identité)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded) {
          tenantId = decoded.tenantId || null;
          depotId = decoded.depotId || null;
          role = decoded.role || null;
        }
      } catch (error) {
        // Token corrompu, géré ensuite par le JwtGuard
      }
    }

    // 2. Headers Axios frontend (x-tenant-id, x-depot-id)
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    // Sécurité : éviter la propagation de "null" ou "undefined" en tant que chaînes
    if (
      headerTenantId &&
      headerTenantId !== 'null' &&
      headerTenantId !== 'undefined'
    ) {
      tenantId = headerTenantId;
    }

    if (req.headers['x-depot-id']) {
      depotId = req.headers['x-depot-id'] as string;
    } else if (req.query.depotId) {
      depotId = req.query.depotId as string;
    }

    // Sécurité : éviter les valeurs invalides ("all", "null", "undefined", vide) transmises par le front
    if (
      depotId === 'all' ||
      depotId === '' ||
      depotId === 'null' ||
      depotId === 'undefined'
    ) {
      depotId = null;
    }

    // Identifiant de requête (Journal Audit) : généré une seule fois ici,
    // au tout début du cycle de vie de la requête, puis conservé sur `req`
    // pour que DepotScopeInterceptor (qui ré-ouvre son propre contexte
    // ALS après les guards) puisse le réutiliser sans le régénérer.
    const requestId = randomUUID();
    (req as any).auditRequestId = requestId;
    const metier = extractMetierFromPath(req.path);
    (req as any).auditMetier = metier;

    // 3. Lancement du contexte asynchrone pour Prisma
    this.depotScope.run({ tenantId, depotId, role, requestId, metier }, () => {
      next();
    });
  }
}