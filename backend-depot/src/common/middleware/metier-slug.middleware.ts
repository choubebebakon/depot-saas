import { Request, Response, NextFunction } from 'express';
import { METIER_SLUG_ALIASES } from '../config/metier-slug.config';

/**
 * Réécrit /api/v1/{slug-metier}/… vers le slug canonique du backend
 * avant le routage NestJS (ex: glacier_snack → glacier, hotel → hotellerie).
 */
export function metierSlugMiddleware(req: Request, _res: Response, next: NextFunction) {
  const match = req.url.match(/^(\/api\/v1)\/([^/?]+)(.*)/);
  if (!match) return next();

  const [, prefix, slug, rest] = match;
  const canonical = METIER_SLUG_ALIASES[slug];
  if (canonical && canonical !== slug) {
    req.url = `${prefix}/${canonical}${rest}`;
  }
  next();
}
