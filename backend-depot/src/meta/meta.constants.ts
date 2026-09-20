import { timingSafeEqual } from 'node:crypto';

/** Un canal Meta au sens du modèle Prisma `MetaIntegration`. */
export type MetaChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER';

/** Motif d'un identifiant Meta : les deux formats Graph réels. */
export const META_ID_PATTERN = /^\d{3,25}$/;

/** Borne de longueur d'un identifiant Meta (les WABA ID font 15-16 chiffres). */
export const MAX_META_ID_LENGTH = 25;

/** Longueur maximale de corps de webhook accepté (anti-DoS, anti-abus). */
export const MAX_WEBHOOK_BODY_BYTES = 128 * 1024;

/** Préfixe d'en-tête de signature de Meta. */
export const SHA256_PREFIX = 'sha256=';

/**
 * Message d'erreur générique renvoyé pour toute signature invalide : ne JAMAIS
 * détailler la raison (absente ? corrompue ? mismatch ?) à un appelant non
 * authentifié — c'est un vecteur d'information pour un attaquant.
 */
export const META_INVALID_SIGNATURE_MESSAGE = 'Invalid signature.';

/** En-tête de signature porté par les webhooks Meta. */
export const META_SIGNATURE_HEADER = 'x-hub-signature-256';

/** Nom du cookie d'état CSRF posé avant l'ouverture du flux Embedded Signup. */
export const META_STATE_COOKIE = 'meta_oauth_state';

/** Version de la Graph API ciblée (fait vérifié n°11 : v4 d'Embedded Signup). */
export const META_GRAPH_VERSION = (process.env.META_GRAPH_VERSION ?? 'v21.0').replace(/^v/, '');

/** Base des appels Graph API (serveur à serveur uniquement, fait vérifié n°2). */
export const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/** Scopes demandés — faits vérifiés n°12 (whatsapp_business_manage_events inclus). */
export const META_WHATSAPP_SCOPES = [
  'business_management',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'whatsapp_business_manage_events',
] as const;

/**
 * Comparaison de deux signatures hexadécimales en temps constant.
 * HMACTemporalEquals évite les attaques par analyse temporelle sur la
 * comparaison de la signature ; une comparaison `===` simple fuirait la
 * position du premier octet divergent.
 */
export function safeHexEquals(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
