/**
 * PARTIE 5 — POLITIQUE D'ÉCHEC NOTCHPAY (transitoire vs définitif).
 *
 * NotchPay documente elle-même des erreurs réseau/opérateur intermittentes
 * (ex. « Service Unavailable » sur le champ phone) : ce sont des échecs
 * TEMPORAIRES, différents d'un échec DÉFINITIF (numéro invalide, fonds
 * insuffisants, canal/numéro incohérent).
 *
 * Règles de ce module :
 *  1. Classification des échecs en catégories, à partir du code HTTP et du
 *     message brut de l'agrégateur (heuristiques documentées, mises à jour au
 *     fil des faits observés en LIVE).
 *  2. Message MARCHAND dédié par catégorie — jamais le message technique brut
 *     de NotchPay, qui reste STRICTEMENT dans les logs serveur.
 *  3. `retryTransient` : retry automatique avec backoff exponentiel croissant
 *     pour les seuls échecs TRANSITOIRES, avant de remonter quoi que ce soit.
 *
 * Module volontairement SANS dépendance NestJS : pur et testable unitairement.
 */

export type NotchPayFailureCategory =
  | 'TRANSIENT'
  | 'INVALID_NUMBER'
  | 'INSUFFICIENT_FUNDS'
  | 'ABANDONED'
  | 'UNKNOWN';

/**
 * Messages MARCHAND (FR) par catégorie — formulation validée, aucune info
 * technique. Le libellé brut de l'agrégateur ne doit JAMAIS apparaître ici.
 */
export const NOTCHPAY_CLIENT_MESSAGES: Record<NotchPayFailureCategory, string> =
  {
    TRANSIENT:
      'Le service mobile money semble temporairement indisponible. Merci de réessayer dans quelques minutes.',
    INVALID_NUMBER:
      'Le numéro saisi ne semble pas valide pour ce moyen de paiement. Vérifiez-le et réessayez.',
    INSUFFICIENT_FUNDS:
      'Le paiement a été refusé, probablement en raison d\u2019un solde insuffisant sur le compte mobile money.',
    ABANDONED:
      'Le paiement n\u2019a pas été finalisé à temps. Vous pouvez réessayer quand vous êtes prêt.',
    UNKNOWN:
      'Une erreur est survenue lors du traitement de votre paiement. Vous pouvez réessayer ou contacter le support si le problème persiste.',
  };

export interface MappedNotchPayFailure {
  category: NotchPayFailureCategory;
  /** true uniquement pour TRANSIENT (éligible au retry automatique). */
  retryable: boolean;
  /** Message marchand dédié (jamais le message technique brut). */
  clientMessage: string;
}

// ── Heuristiques de classification ────────────────────────────────────────

/** Numéro/format invalide (échec DÉFINITIF — réessayer avec le même numéro échouera). */
const NUMBER_PATTERNS: RegExp[] = [
  /invalid\s+(phone|msisdn|number|recipient|b[eé]n[eé]ficiaire)/i,
  /(phone|msisdn)[^.\n]{0,24}(invalid|incorrect|malformed)/i,
  /num[eé]ro[^.\n]{0,24}(invalide|incorrect|non\s+valide)/i,
  /num[eé]ro\s+de\s+t[eé]l[eé]phone\s+invalide/i,
  /bad\s+(phone|msisdn|number)/i,
  /format\s+(du\s+num[eé]ro|phone)/i,
];

/** Fonds/solde insuffisant (échec DÉFINITIF — côté du client, pas du système). */
const INSUFFICIENT_PATTERNS: RegExp[] = [
  /insufficient\s+(funds|balance|amount)/i,
  /balance\s+insufficient/i,
  /solde\s+insuffisant/i,
  /fonds\s+insuffisant/i,
  /not\s+enough\s+(money|funds|balance)/i,
];

/** Annulé / expiré sans validation (échec DÉFINITIF — le client peut relancer). */
const ABANDONED_PATTERNS: RegExp[] = [
  /cancel/i,
  /abandon/i,
  /expire/i,
  /non\s+finalis[eé]/i,
  /not\s+finaliz/i,
];

/**
 * Messages TRANSITOIRES : indisponibilité opérateur/plateforme. Le pattern
 * `unavailable` est volontairement large — à ce stade, une indisponibilité
 * renvoyée par l'agrégateur est par nature passagère.
 */
const TRANSIENT_MESSAGE_PATTERNS: RegExp[] = [
  /service\s+unavailable/i,
  /temporar/i,
  /intermittent/i,
  /try\s+again/i,
  /r[eé]essayez/i,
  /timeout|timed?\s*-?\s*out/i,
  /busy/i,
  /overload/i,
  /maintenance/i,
  /unavailable/i,
];

/** Codes HTTP transitoires (timeouts, surcharge, indisponibilité provider). */
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Erreurs réseau pures (la requête n'a jamais atteint/retourné de provider). */
const NETWORK_ERROR_PATTERN =
  /(ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network error)/i;

/**
 * Classe un échec NotchPay (code HTTP + message brut) en catégorie, avec le
 * message marchand dédié. Heuristiques documentées — à enrichir au fil des
 * cas réels observés en production (chaque cas inconnu doit rester UNKNOWN
 * plutôt que d'être mal classé).
 */
export function classifyNotchPayFailure(
  statusCode: number | undefined | null,
  rawMessage: string | undefined | null,
): MappedNotchPayFailure {
  const mapped = (
    category: NotchPayFailureCategory,
  ): MappedNotchPayFailure => ({
    category,
    retryable: category === 'TRANSIENT',
    clientMessage: NOTCHPAY_CLIENT_MESSAGES[category],
  });

  const message = String(rawMessage ?? '');

  // 1) Messages SPÉCIFIQUES (définitifs) — priment sur le code HTTP générique :
  //    un 502 portant « Invalid phone number » est un échec définitif, pas un
  //    problème d'infrastructure.
  for (const pattern of NUMBER_PATTERNS) {
    if (pattern.test(message)) return mapped('INVALID_NUMBER');
  }
  for (const pattern of INSUFFICIENT_PATTERNS) {
    if (pattern.test(message)) return mapped('INSUFFICIENT_FUNDS');
  }
  for (const pattern of ABANDONED_PATTERNS) {
    if (pattern.test(message)) return mapped('ABANDONED');
  }

  // 2) TRANSITOIRE : indisponibilité réseau/opérateur/plateforme.
  const transientByStatus =
    statusCode !== undefined &&
    statusCode !== null &&
    TRANSIENT_STATUS_CODES.has(statusCode);
  const transientByMessage =
    TRANSIENT_MESSAGE_PATTERNS.some((p) => p.test(message)) ||
    NETWORK_ERROR_PATTERN.test(message);
  if (transientByStatus || transientByMessage) return mapped('TRANSIENT');

  // 3) Non catégorisé : message générique neutre (jamais le brut), non retryable.
  return mapped('UNKNOWN');
}

/**
 * Délais de backoff exponentiel (ms) — quelques tentatives, délais croissants.
 * Total d'attente maximal ≈ 6 s avant de remonter l'échec au commerçant.
 */
export const TRANSIENT_RETRY_DELAYS_MS = [500, 1500, 4000];

const defaultSleep = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Exécute `task` en réessayant automatiquement les échecs TRANSITOIRES avec
 * backoff croissant. Les échecs non transitoires (définitifs) remontent
 * immédiatement, sans délai inutile pour le commerçant.
 *
 * @param task        opération à (re)tenter
 * @param isRetryable le dernier échec est-il transitoire ?
 * @param delaysMs    délais entre tentatives (par défaut 0.5s / 1.5s / 4s)
 * @param sleep       injectable pour tester avec des timers factices
 */
export async function retryTransient<T>(
  task: () => Promise<T>,
  isRetryable: (error: unknown) => boolean,
  delaysMs: readonly number[] = TRANSIENT_RETRY_DELAYS_MS,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delaysMs.length; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt >= delaysMs.length || !isRetryable(error)) break;
      await sleep(delaysMs[attempt]);
    }
  }
  throw lastError;
}
