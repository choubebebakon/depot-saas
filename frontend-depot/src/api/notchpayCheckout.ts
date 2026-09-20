/**
 * NotchPay — ouverture du paiement d'abonnement (flux OFFICIEL « Collect »).
 *
 * FAITS VÉRIFIÉS (docs developer.notchpay.co + test LIVE du compte GesTock) :
 * 1. NotchPay expose une page de paiement HÉBERGÉE (« Collect »). Le parcours
 *    documenté est : créer le paiement côté serveur → REDIRIGER le client vers
 *    `authorization_url` (`window.location.href = data.authorization_url`).
 * 2. Il n'existe AUCUN SDK JavaScript navigateur documenté. L'ancien code
 *    chargeait `https://checkout.notchpay.co/script.js` : cette URL n'existe
 *    pas (ERR_CONNECTION_RESET constaté en réel) et cet hôte ne pointe pas sur
 *    l'infrastructure NotchPay (`api.` et `pay.` partagent l'IP
 *    148.113.235.168, `checkout.` non).
 * 3. Le numéro Mobile Money / les données de carte sont donc saisis sur la page
 *    NotchPay : aucune donnée bancaire ne transite par GesTock.
 *
 * SÉCURITÉ : la clé publique n'est PAS nécessaire dans le navigateur (elle ne
 * sert qu'aux appels API du backend). Le contrôle de domaine ci-dessous
 * empêche toute redirection ouverte si la réponse du backend était altérée.
 * L'activation de l'abonnement n'est JAMAIS déclenchée ici : elle reste
 * pilotée par le webhook NotchPay signé côté serveur.
 */

export type NotchPayCheckoutPayload = {
  /** URL de paiement renvoyée par le backend (authorization_url NotchPay). */
  checkoutUrl?: string;
  /** Alias défensif si le backend exposait le nom brut du champ. */
  authorizationUrl?: string;
  /** Conservé pour compatibilité d'appel — inutilisé par ce flux. */
  publicKey?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  channel?: string;
  email?: string;
  phone?: string;
  reference?: string;
  description?: string;
};

/** Domaines NotchPay légitimes pour la page de paiement hébergée. */
const NOTCHPAY_HOST_PATTERN = /(^|\.)notchpay\.co$/i;

/**
 * Résout et VALIDE l'URL de paiement hébergée.
 * Jette une erreur explicite si l'URL est absente, malformée, non HTTPS ou
 * hors domaine NotchPay (protection contre la redirection ouverte).
 */
export function resolveNotchPayCheckoutUrl(
  checkout: Pick<NotchPayCheckoutPayload, 'checkoutUrl' | 'authorizationUrl'>,
): string {
  const raw = checkout?.checkoutUrl ?? checkout?.authorizationUrl;
  if (!raw) {
    throw new Error(
      'URL de paiement NotchPay indisponible (authorization_url absent de la réponse).',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('URL de paiement NotchPay invalide.');
  }

  if (
    parsed.protocol !== 'https:' ||
    !NOTCHPAY_HOST_PATTERN.test(parsed.hostname)
  ) {
    throw new Error(
      'URL de paiement NotchPay non conforme (domaine attendu : notchpay.co).',
    );
  }

  return parsed.toString();
}

/**
 * Redirige le commerçant vers la page de paiement sécurisée NotchPay.
 * C'est la SEULE action déclenchée côté navigateur : la confirmation et
 * l'activation restent entièrement côté serveur (webhook signé).
 */
export function redirectToNotchPayCheckout(
  checkout: NotchPayCheckoutPayload,
): void {
  const url = resolveNotchPayCheckoutUrl(checkout);
  console.info('[NotchPay] Redirection vers la page de paiement hébergée.');
  window.location.assign(url);
}

/**
 * @deprecated Alias rétro-compatible de {@link redirectToNotchPayCheckout}.
 * Le nom d'origine évoquait un SDK inline qui n'existe pas côté NotchPay.
 */
export function openNotchPayCheckout(checkout: NotchPayCheckoutPayload): void {
  redirectToNotchPayCheckout(checkout);
}



