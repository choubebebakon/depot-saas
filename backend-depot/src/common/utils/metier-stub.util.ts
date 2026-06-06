import { HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { METIER_SLUG_ALIASES } from '../config/metier-slug.config';

/** Routes globales — ne jamais stubber */
const GLOBAL_PREFIXES = new Set([
  'auth', 'users', 'depots', 'tenants', 'admin', 'payments', 'onboarding',
  'audit', 'exports', 'invoices', 'articles', 'clients', 'fournisseurs',
  'stocks', 'ventes', 'commandes', 'livraisons', 'caisse', 'catalogue',
  'consignes', 'commissions', 'dlc', 'rapports', 'analyses', 'maintenance',
  'tasks', 'notifications', 'chatbot', 'paiements', 'transferts', 'tournees',
  'impression',
]);

const CANONICAL_METIERS = new Set([
  'depot-boissons', 'boutique', 'quincaillerie', 'pharmacie', 'restaurant',
  'telephonie', 'supermarche', 'ciment-btp', 'pressing', 'garage', 'elevage',
  'salon', 'parfumerie', 'boulangerie', 'glacier', 'librairie', 'clinique',
  'transport', 'immobilier', 'hotellerie',
  ...Object.keys(METIER_SLUG_ALIASES),
  ...Object.values(METIER_SLUG_ALIASES),
]);

function resolveMetierSlug(slug: string): string | null {
  const canonical = METIER_SLUG_ALIASES[slug] ?? slug;
  return CANONICAL_METIERS.has(canonical) ? canonical : null;
}

function parseMetierPath(url: string): { metier: string; resource: string; id?: string } | null {
  const path = url.split('?')[0];
  const match = path.match(/^\/api\/v1\/([^/]+)\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;

  const [, rawMetier, resource, id] = match;
  if (GLOBAL_PREFIXES.has(rawMetier)) return null;

  const metier = resolveMetierSlug(rawMetier);
  if (!metier) return null;

  return { metier, resource, id };
}

/**
 * Fallback systémique pour routes métier non implémentées.
 * Retourne true si une réponse stub a été envoyée.
 */
export function tryMetierStubResponse(req: Request, res: Response): boolean {
  const parsed = parseMetierPath(req.url);
  if (!parsed) return false;

  const method = req.method.toUpperCase();

  if (method === 'DELETE') {
    res.status(HttpStatus.NO_CONTENT).send();
    return true;
  }

  if (method === 'GET') {
    if (parsed.id) {
      res.status(HttpStatus.OK).json(null);
    } else {
      res.status(HttpStatus.OK).json({ data: [], total: 0 });
    }
    return true;
  }

  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    res.status(method === 'POST' ? HttpStatus.CREATED : HttpStatus.OK).json({
      id: parsed.id ?? `stub-${Date.now()}`,
      ...body,
      tenantId: body.tenantId ?? null,
    });
    return true;
  }

  return false;
}
