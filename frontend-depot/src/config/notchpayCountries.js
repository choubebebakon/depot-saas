/**
 * ─────────────────────────────────────────────────────────────────────────
 * PARTIE 2 — CONFIG CENTRALISÉE COUVERTURE NOTCHPAY (miroir frontend)
 *
 * ⚠️ MIROIR de la source de vérité backend :
 *    backend-depot/src/common/config/notchpay-channels.config.ts
 *
 * Toute modification de la couverture réelle NotchPay (pays / devises /
 * canaux) DOIT être appliquée dans les deux fichiers, sinon le frontend
 * proposera un pays que le backend refusera (fail-closed) — ou l'inverse.
 *
 * Règle : NE JAMAIS ajouter un pays/canal "supposé" couvert. COUVERTURE
 * VALIDÉE EN CONDITIONS RÉELLES via GET /channels (compte LIVE GesTock,
 * réponse archivée : backend-depot/notchpay-channels-raw.json) :
 *  - cm.mtn / cm.orange : actifs (active=true, live=true), CM, XAF,
 *    min 10 / max 500 000 XAF ;
 *  - canal 'card' (Visa/Mastercard) : INACTIF sur le compte → retiré des
 *    canaux proposés tant qu'il n'est pas activé (réactivation ici + backend
 *    config dès activation) ;
 *  - FAIT VALIDÉ n°5 : aucun réglage pays dans le dashboard NotchPay — la
 *    disponibilité dépend uniquement des canaux activés sur le compte.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Pays par défaut (rétro-compatibilité : comportement existant). */
export const DEFAULT_COUNTRY_ISO2 = 'CM';

/**
 * Couverture NotchPay confirmée.
 * `confirmation` documente le niveau de preuve :
 *  - CODE_CONFIRMED      : prouvé par le code de production existant
 *  - DASHBOARD_CONFIRMED : prouvé par une vérification du dashboard NotchPay
 */
export const NOTCHPAY_COUNTRIES = [
  {
    iso2: 'CM',
    name: 'Cameroun',
    dialCode: '237',
    flag: '🇨🇲',
    currency: 'XAF',
    // Plan de numérotation camerounais : 6XXXXXXXX (9 chiffres après l'indicatif).
    phoneRegex: '^2376\\d{8}$',
    phonePlaceholder: '6XX XXX XXX',
    // Canaux actifs pour ce pays — IDs RÉELS de GET /channels (FAIT VALIDÉ
    // n°6). Le canal 'card' est INACTIF sur le compte LIVE → non listé :
    // les tuiles Visa/Mastercard disparaissent automatiquement (fail-closed).
    channels: [
      { code: 'cm.mtn', label: 'MTN MoMo', methods: ['MTN_MOMO'], requiresPhone: true, minAmount: 10, maxAmount: 500000 },
      { code: 'cm.orange', label: 'Orange Money', methods: ['ORANGE_MONEY'], requiresPhone: true, minAmount: 10, maxAmount: 500000 },
    ],
    confirmation: 'DASHBOARD_CONFIRMED',
  },
  // ⚠️ NE RIEN AJOUTER sans confirmation via GET /channels (jamais via
  // GET /countries, FAIT VALIDÉ n°6).
];

/** Retourne la couverture d'un pays, ou undefined si non couvert (fail-closed). */
export function getCountryCoverage(iso2) {
  if (!iso2) {
    return NOTCHPAY_COUNTRIES.find((c) => c.iso2 === DEFAULT_COUNTRY_ISO2);
  }
  const upper = String(iso2).trim().toUpperCase();
  return NOTCHPAY_COUNTRIES.find((c) => c.iso2 === upper);
}

/** Le canal est-il réellement actif pour ce pays sur le compte NotchPay ? */
export function isChannelSupported(iso2, channel) {
  const country = getCountryCoverage(iso2);
  if (!country) return false;
  return country.channels.some((c) => c.code === String(channel).toLowerCase());
}

/**
 * Méthodes de paiement (ids `PaymentMethod`) réellement disponibles pour un
 * pays. Utilisé par le sélecteur de méthode : aucune tuile n'est affichée pour
 * un canal non couvert (fail-closed, aligné sur la validation backend).
 */
export function methodsForCountry(iso2) {
  const country = getCountryCoverage(iso2);
  if (!country) return [];
  return country.channels.flatMap((c) => c.methods);
}

/**
 * Canal NotchPay associé à une méthode (mtn / orange / card).
 * Miroir de `METHOD_TO_CHANNEL` côté backend (billing.service.ts).
 */
export function channelForMethod(iso2, method) {
  const country = getCountryCoverage(iso2);
  if (!country) return undefined;
  const channel = country.channels.find((c) =>
    c.methods.includes(String(method).toUpperCase()),
  );
  return channel?.code;
}

/**
 * Normalise un numéro Mobile Money pour le transport frontend → backend :
 * chiffres purs avec indicatif du pays, SANS '+', ex. 237670000000.
 *
 * ⚠️ Format ENVOYÉ À NOTCHPAY (fait validé par le support NotchPay, 2026-09) :
 * le backend convertit ce numéro en E.164 STRICT AVEC '+' avant l'appel API
 * (backend-depot : toE164MomoPhone → +237670000000 pour le CM). La chaîne
 * complète est donc : saisie (locale ou internationale) → normalisation ici
 * (sans '+') → validation regex pays → E.164 '+' strict côté backend → API
 * NotchPay.
 * Fail-closed : pays non couvert ou numéro vide → null.
 */
export function normalizeMomoPhoneForCountry(iso2, phone) {
  if (!phone) return null;
  const country = getCountryCoverage(iso2);
  if (!country) return null;
  const cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith(country.dialCode)) return cleaned;
  return country.dialCode + cleaned;
}

/**
 * Valide un numéro Mobile Money contre la couverture réelle du pays.
 * Remplace l'ancienne validation Cameroun-only codée en dur.
 *
 * Accepte volontairement les DEUX saisies utilisateur :
 *   - format international : `237670000000` / `+237670000000`
 *   - format local (celui du placeholder) : `6XX XXX XXX`
 * Le test porte sur la forme normalisée : un indicatif étranger est refusé.
 */
export function validateMomoPhoneForCountry(iso2, phone) {
  const country = getCountryCoverage(iso2);
  if (!country) return false;
  if (country.channels.filter((c) => c.requiresPhone).length === 0) return false;
  const normalized = normalizeMomoPhoneForCountry(iso2, phone);
  if (!normalized) return false;
  return new RegExp(country.phoneRegex).test(normalized);
}
