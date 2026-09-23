/**
 * ─────────────────────────────────────────────────────────────────────────
 * Secours push mobile money — SOURCE UNIQUE (frontend).
 * Données CONFIRMÉES par le support NotchPay (2026-09).
 * ─────────────────────────────────────────────────────────────────────────
 *
 * FAITS VALIDÉS PAR LE SUPPORT NOTCHPAY :
 * - Les canaux mobile money (cm.mtn, cm.orange, et tout canal du même type)
 *   déclenchent par DÉFAUT un vrai push automatique (pop-up PIN sur le
 *   téléphone du client) : le client n'a normalement RIEN à composer
 *   manuellement.
 * - Le push peut néanmoins échouer à s'afficher pour des raisons HORS DU
 *   CONTRÔLE de GesTock/NotchPay : timeout réseau opérateur, session USSD
 *   déjà active sur l'appareil, écran verrouillé/en veille au moment de
 *   l'envoi.
 * - AUCUN moyen technique ne permet de forcer l'affichage si l'opérateur ne
 *   distribue pas le push. Ce comportement n'est PAS spécifique à MTN : il
 *   concerne TOUT push mobile money.
 *
 * CONDUITE À TENIR (identique quel que soit l'opérateur) :
 * 1. Décompte visuel de 2 à 3 minutes (PUSH_WAIT_SECONDS) invitant le client
 *    à vérifier son téléphone.
 * 2. Bouton « Relancer l'initiation » (MÊME canal) si aucune validation n'a
 *    eu lieu passé ce délai.
 * 3. Instruction de secours affichée UNIQUEMENT APRÈS l'expiration du
 *    décompte (jamais présentée comme l'étape normale), SPÉCIFIQUE À
 *    L'OPÉRATEUR DÉTECTÉ — jamais un code générique unique pour tous :
 *    - cm.mtn : `*126#` → menu de validation des transactions en attente,
 *      ou ouvrir l'app MTN MoMo (CONFIRMÉ par le support NotchPay) ;
 *    - Orange et les autres opérateurs : le code / la procédure équivalente
 *      n'est PAS confirmé à ce jour → `confirmed: false`. À vérifier auprès
 *      du support NotchPay AVANT de l'afficher au client : on ne devine
 *      JAMAIS un code qui pourrait être faux.
 */

/** Décompte d'attente avant secours/relance : 2 min 30 (fourchette 2-3 min). */
export const PUSH_WAIT_SECONDS = 150;

export const OPERATOR_PUSH_FALLBACK = {
  // Confirmé par le support NotchPay : menu de validation des transactions
  // en attente, ou application MTN MoMo.
  'cm.mtn': {
    label: 'MTN MoMo',
    confirmed: true,
    steps: [
      'Composez *126# sur le téléphone lié au paiement.',
      "Choisissez le menu de validation des transactions en attente, puis validez le paiement.",
      "Ou ouvrez l'application MTN MoMo : la demande figure dans les approbations / l'historique.",
    ],
  },
  // NON CONFIRMÉ — à obtenir auprès du support NotchPay avant tout affichage
  // client. NE PAS renseigner de code tant que ce n'est pas validé.
  'cm.orange': {
    label: 'Orange Money',
    confirmed: false,
    steps: [],
  },
};

/** Secours par défaut (canal inconnu) : jamais de code deviné. */
const DEFAULT_FALLBACK = {
  label: 'votre opérateur mobile money',
  confirmed: false,
  steps: [],
};

/**
 * Secours pour un canal donné, ou le secours neutre par défaut.
 * @param {string} channelId ID de canal NotchPay (ex. 'cm.mtn', 'cm.orange')
 */
export function getPushFallback(channelId) {
  return OPERATOR_PUSH_FALLBACK[channelId] ?? DEFAULT_FALLBACK;
}

/* ── Paiement en attente : contexte mémorisé pour le retour depuis la page
      hébergée NotchPay (le push est déclenché là-bas ; au retour sur GesTock
      le commerçant voit le moniteur avec décompte / relance / secours). ── */

export const PENDING_PAYMENT_STORAGE_KEY = 'gestock.pendingPayment.v1';

/** Au-delà de cet âge, un paiement en attente n'est plus proposé au retour. */
export const PENDING_PAYMENT_MAX_AGE_MS = 30 * 60 * 1000; // 30 min

/**
 * Mémorise le contexte du paiement en attente avant redirection NotchPay.
 * @param {{reference: string, channel: string, methodId: string, phone: ?string,
 *           planId: string, cycle: string, country: string}} pending
 */
export function storePendingPayment(pending) {
  try {
    sessionStorage.setItem(
      PENDING_PAYMENT_STORAGE_KEY,
      JSON.stringify({ ...pending, createdAt: Date.now() }),
    );
  } catch {
    /* stockage indisponible (navigation privée stricte) : le moniteur ne
       s'affichera simplement pas au retour — dégradation acceptable. */
  }
}

/**
 * Lit le paiement en attente encore valide (non expiré), ou null.
 * Nettoie le stockage si l'entrée est expirée.
 */
export function readPendingPayment() {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed?.reference ||
      !parsed?.createdAt ||
      Date.now() - parsed.createdAt > PENDING_PAYMENT_MAX_AGE_MS
    ) {
      clearPendingPayment();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Efface le paiement en attente (succès, échec, annulation). */
export function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

