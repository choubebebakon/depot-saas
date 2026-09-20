import { PaymentStatus } from '@prisma/client';

/**
 * PARTIE 3 (contrainte 5) — Résolution du doublon PaymentStatus SUCCESS/COMPLETED.
 *
 * ⚠️ L'enum Prisma `PaymentStatus` contient deux valeurs sémantiquement
 * identiques : `SUCCESS` et `COMPLETED`. Le Postgres enum sous-jacent ne se
 * supprime pas proprement tant que des lignes y font référence : les DEUX
 * valeurs restent donc déclarées dans le schéma (aucune perte de données).
 *
 * Convention canonique GesTock :
 *   - `SUCCESS` = statut canonique pour un paiement abouti (utilisé par tout
 *     le code actif : markPaymentSuccess, webhooks, reconciliation).
 *   - `COMPLETED` = ⚠️ DÉPRÉCIÉ — valeur historique, ne JAMAIS écrire dans
 *     une nouvelle ligne. Ce module la lit et la réinterprète proprement.
 *
 * NB : à date, AUCUNE écriture de `COMPLETED` n'a été trouvée dans le code
 * (vérifié par recherche exhaustive `PaymentStatus.COMPLETED`). Les lignes
 * `COMPLETED` existantes en base, s'il y en a, proviennent d'écritures
 * historiques manuelles ou de versions antérieures — la migration SQL
 * `20260917000000_canonicalize_payment_status` les réaffecte vers SUCCESS.
 */

/** Statut canonique d'un paiement abouti. */
export const CANONICAL_SUCCESS_STATUS = PaymentStatus.SUCCESS;

/** Valeurs historiques dépréciées qui DOIVENT être réinterprétées à la lecture. */
export const DEPRECATED_SUCCESS_STATUSES: PaymentStatus[] = [
  PaymentStatus.COMPLETED,
];

/**
 * Statuts terminaux (un paiement dans cet état ne doit plus être muté).
 *
 * ⚠️ `FAILED` n'est VOLONTAIREMENT PAS terminal : un paiement Mobile Money
 * initié peut être basculé en `FAILED` par le job d'expiration (PENDING trop
 * ancien) AVANT qu'une confirmation opérateur légitime n'arrive par webhook
 * signé. Dans ce cas, refuser la transition laisserait le client débité sans
 * abonnement activé — pire conséquence qu'un no-op. La protection contre la
 * double activation reste assurée par le statut `SUCCESS`, lui terminal.
 */
export const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.SUCCESS,
  PaymentStatus.COMPLETED,
  PaymentStatus.REFUNDED,
];

/**
 * Normalise n'importe quel statut (y compris déprécié) vers la valeur canonique.
 * Accepte volontairement `string` : les enums Prisma sont des unions de chaînes,
 * et cette fonction est aussi appelée sur des statuts issus de payloads externes
 * (webhooks) — l'entrée est donc déjà normalisée/restringée ici (fail-safe).
 */
export function canonicalizePaymentStatus(
  status?: string | null,
): PaymentStatus | undefined {
  if (!status) return undefined;
  const normalized = String(status).toUpperCase() as PaymentStatus;
  if (DEPRECATED_SUCCESS_STATUSES.includes(normalized)) {
    return CANONICAL_SUCCESS_STATUS;
  }
  return normalized;
}

/**
 * Un paiement peut-il muter vers `target` ?
 * Idempotence stricte (contrainte 10) : un paiement déjà abouti (SUCCESS ou
 * COMPLETED historique) n'est plus muté (anti double-activation / double
 * prolongation d'abonnement) ; `REFUNDED` est figé.
 * `PENDING` ET `FAILED` peuvent évoluer (retry opérateur / confirmation tardive).
 */
export function canTransitionTo(
  current: PaymentStatus,
  target: PaymentStatus,
): boolean {
  // Transition identique = no-op (jamais une double écriture).
  if (current === target) return false;
  const isCurrentTerminal = TERMINAL_PAYMENT_STATUSES.includes(current);
  // Un succès (canonique ou historique) ne peut être re-confirmé ni échoué.
  if (
    DEPRECATED_SUCCESS_STATUSES.includes(current) ||
    current === PaymentStatus.SUCCESS
  ) {
    return target === PaymentStatus.REFUNDED;
  }
  // Un paiement remboursé est figé.
  if (current === PaymentStatus.REFUNDED) return false;
  // PENDING / FAILED peuvent évoluer (retry opérateur légitime sur FAILED).
  return isCurrentTerminal ? false : true;
}
