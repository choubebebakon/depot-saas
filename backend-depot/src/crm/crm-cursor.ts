import { crmErrors } from './crm-errors';

/**
 * Curseur opaque de pagination (keyset pagination).
 *
 * Pourquoi un curseur et non `skip` : sur un historique d'achats alimenté en
 * continu, `skip` re-scanne toutes les lignes précédentes (coût linéaire en
 * profondeur) et peut dupliquer ou perdre des lignes si une vente est insérée
 * entre deux pages. Le curseur fige le dernier couple (date, id) vu et la
 * requête suivante reprend strictement après lui — coût constant, pas de
 * doublon, pas de trou.
 */

export interface CrmHistoryCursor {
  /** Date ISO de la dernière vente de la page précédente. */
  readonly date: string;
  /** Identifiant de cette vente : départage deux ventes à la même date. */
  readonly id: string;
}

/** Longueur maximale acceptée pour un curseur encodé (anti-abus). */
const MAX_CURSOR_LENGTH = 256;

export function encodeHistoryCursor(cursor: CrmHistoryCursor): string {
  return Buffer.from(
    JSON.stringify({ d: cursor.date, i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

export function decodeHistoryCursor(raw: string): CrmHistoryCursor {
  const normalized = raw.trim();

  if (!normalized || normalized.length > MAX_CURSOR_LENGTH) {
    throw crmErrors.validation('Curseur de pagination invalide.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(normalized, 'base64url').toString('utf8'));
  } catch {
    throw crmErrors.validation('Curseur de pagination illisible.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw crmErrors.validation('Curseur de pagination invalide.');
  }

  const candidate = parsed as Record<string, unknown>;
  const date = candidate.d;
  const id = candidate.i;

  if (typeof date !== 'string' || typeof id !== 'string' || !id.trim()) {
    throw crmErrors.validation('Curseur de pagination incomplet.');
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw crmErrors.validation('Curseur de pagination : date invalide.');
  }

  return { date: parsedDate.toISOString(), id };
}