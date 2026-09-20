import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Règles partagées d'identité client multi-canal (WhatsApp / Instagram /
 * Messenger), utilisées par le module Clients générique ET par les services
 * Clients des modules métier (boutique, supermarché, dépôt de boissons).
 *
 * Pourquoi un utilitaire plutôt qu'une méthode de service : les quatre modules
 * possèdent chacun une classe nommée `ClientsService`. Importer l'un dans
 * l'autre créerait une ambiguïté de nom et un couplage métier inutile. Une
 * fonction pure exportée ici est la seule source de vérité, testable sans base.
 */

/**
 * Normalise un identifiant de canal : `''` ou espaces => `NULL` (le commerçant
 * efface volontairement le rattachement). Toute autre valeur est nettoyée de
 * ses espaces de bord, tels qu'ils arrivent des formulaires et des exports.
 */
export function normalizeChannelId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Traduit une violation d'unicité (`P2002`) en 409 lisible.
 *
 * L'unicité des identifiants de canal est portée par la BASE (index uniques
 * composites `(tenantId, telephone|instagramId|messengerId)`) : elle reste
 * vraie même sous deux webhooks simultanés, ce qu'aucune vérification
 * applicative ne garantirait. Cette fonction ne fait que rendre l'erreur
 * compréhensible pour l'utilisateur au lieu d'un 500 opaque.
 */
export function mapUniqueViolation(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'Un client possède déjà cet identifiant (téléphone, Instagram ou Messenger) dans ce dépôt.',
    );
  }
  throw error;
}