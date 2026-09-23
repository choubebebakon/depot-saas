import { PaymentMethod } from '@prisma/client';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * PARTIE 2 — SOURCE DE VÉRITÉ UNIQUE : COUVERTURE NOTCHPAY (pays / devises /
 * canaux), utilisée par la validation backend (DTOs + services) et, à terme,
 * par le sélecteur de pays du frontend.
 *
 * ⚠️ COUVERTURE RÉELLE VALIDÉE EN CONDITIONS RÉELLES (compte LIVE GesTock) :
 * source GET /channels (clé publique), réponse archivée dans
 * backend-depot/notchpay-channels-raw.json. FAIT VALIDÉ n°6 : `GET /countries`
 * ne doit JAMAIS servir de référence (liste mondiale sans lien avec le
 * compte) ; il n'existe par ailleurs AUCUNE configuration manuelle des pays
 * dans le dashboard NotchPay — la disponibilité dépend uniquement des canaux
 * activés sur le compte (FAIT VALIDÉ n°5).
 *
 *  - cm.mtn  (MTN MoMo CM)        : active=true, live=true, CM, XAF,
 *    min 10 / max 500 000 XAF.
 *  - cm.orange (Orange Money CM)  : active=true, live=true, CM, XAF,
 *    min 10 / max 500 000 XAF.
 *  - card (Visa/Mastercard)       : active=false, live=false sur CE compte →
 *    NON SERVABLE (fail-closed). Les codes des autres canaux/pays
 *    (eumm, yoomee, bank, paypal, *.mtn, *.airtel…) sont tous inactive=false.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Canaux NotchPay exposés à l'initialisation de paiement (IDs réels de GET /channels). */
export type NotchPayChannelCode = 'cm.mtn' | 'cm.orange' | 'card';

export interface NotchPayChannelMapping {
  /** ID canal tel qu'attendu par l'API NotchPay (champ `channel`), ex. 'cm.mtn'. */
  code: NotchPayChannelCode;
  /** Méthodes de paiement Prisma autorisées sur ce canal. */
  paymentMethods: PaymentMethod[];
  /** Le canal requiert-il un numéro de téléphone (Mobile Money) ? */
  requiresPhone: boolean;
  /**
   * Canal réellement utilisable sur le compte NotchPay LIVE (active=true ET
   * live=true dans GET /channels). FAIT VALIDÉ n°6 : fail-closed si false.
   */
  servable: boolean;
  /** Montant minimum accepté par le canal (devise du pays), si publié. */
  minAmount?: number;
  /** Montant maximum accepté par canal/transaction (ex. MoMo CM : 500 000 XAF). */
  maxAmount?: number;
}

export interface NotchPayCountryCoverage {
  /** Code pays ISO 3166-1 alpha-2. */
  iso2: string;
  /** Nom d'affichage (frontend). */
  name: string;
  /** Indicatif international (sans '+'). */
  dialCode: string;
  /** Regex de validation d'un numéro Mobile Money au format international. */
  phoneRegex: string;
  /** Devise de facturation de ce pays. */
  currency: string;
  /** Canaux réellement actifs sur le compte NotchPay pour ce pays. */
  channels: NotchPayChannelMapping[];
  /** Niveau de confirmation de la couverture (transparence, pas de sur-promesse). */
  confirmation: 'CODE_CONFIRMED' | 'DASHBOARD_CONFIRMED';
}

export const DEFAULT_COUNTRY_ISO2 = 'CM';

/**
 * Méthodes de paiement Prisma servibles via NotchPay.
 * ⚠️ `STRIPE` est volontairement ABSENT (décommissionnement PARTIE 1, phase 1) :
 * la valeur reste dans l'enum Prisma pour l'historique, mais aucun nouveau
 * paiement ne doit la référencer. Les cartes passent par NotchPay (channel
 * 'card') via VISA_CARD / MASTERCARD.
 */
export const NOTCHPAY_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.MTN_MOMO,
  PaymentMethod.ORANGE_MONEY,
  PaymentMethod.VISA_CARD,
  PaymentMethod.MASTERCARD,
];

/**
 * Couverture NotchPay VALIDÉE via GET /channels (compte LIVE GesTock,
 * réponse archivée : backend-depot/notchpay-channels-raw.json).
 * LIMITES MONTANT réelles des canaux MoMo CM : min 10 / max 500 000 XAF.
 * ⚠️ Conséquence produit (à trancher) : les cycles ANNUELS PME (≈593 670 XAF
 * TTC) et ENTERPRISE (≈1 187 730 XAF TTC) dépassent le plafond MoMo de
 * 500 000 XAF — ils ne sont payables en MoMo qu'en fractionnant ou en
 * activant le canal carte (actuellement inactif sur le compte).
 */
export const NOTCHPAY_COVERAGE: NotchPayCountryCoverage[] = [
  {
    iso2: 'CM',
    name: 'Cameroun',
    dialCode: '237',
    // MTN MoMo CM : 6XXXXXXXX (9 chiffres après l'indicatif). Orange Money CM
    // partage le préfixe 6 dans le plan de numérotation camerounais.
    phoneRegex: '^2376\\d{8}$',
    currency: 'XAF',
    confirmation: 'DASHBOARD_CONFIRMED',
    channels: [
      {
        code: 'cm.mtn',
        paymentMethods: [PaymentMethod.MTN_MOMO],
        requiresPhone: true,
        servable: true,
        minAmount: 10,
        maxAmount: 500_000,
      },
      {
        code: 'cm.orange',
        paymentMethods: [PaymentMethod.ORANGE_MONEY],
        requiresPhone: true,
        servable: true,
        minAmount: 10,
        maxAmount: 500_000,
      },
      // FAIT VALIDÉ n°6 : canal carte INACTIF sur le compte LIVE
      // (active=false, live=false dans GET /channels). Non servable tant que
      // le canal n'est pas activé — fail-closed, message explicite côté API.
      // Réactiver ici (servable: true + limites) dès activation du canal.
      {
        code: 'card',
        paymentMethods: [PaymentMethod.VISA_CARD, PaymentMethod.MASTERCARD],
        requiresPhone: false,
        servable: false,
      },
    ],
  },
  // ⚠️ NE RIEN AJOUTER ICI tant que GET /channels ne confirme pas de canal
  // actif supplémentaire (fail-closed, FAIT VALIDÉ n°6).
];

/**
 * Limites de montant réelles d'un canal (issues de GET /channels).
 * @returns undefined si canal/pays inconnu — l'appelant décide du repli.
 */
export function getChannelLimits(
  iso2: string | undefined | null,
  channel: string | undefined | null,
): { minAmount?: number; maxAmount?: number } | undefined {
  const country = getCountryCoverage(iso2);
  if (!country || !channel) return undefined;
  const found = country.channels.find(
    (c) => c.code === String(channel).toLowerCase(),
  );
  if (!found) return undefined;
  return { minAmount: found.minAmount, maxAmount: found.maxAmount };
}

/**
 * Retourne la couverture d'un pays, ou undefined si le pays n'est PAS couvert
 * par le compte NotchPay (fail-closed : un pays inconnu est refusé).
 */
export function getCountryCoverage(
  iso2: string | undefined | null,
): NotchPayCountryCoverage | undefined {
  if (!iso2) {
    // Comportement rétro-compatible : pas de pays fourni → Cameroun (défaut).
    return NOTCHPAY_COVERAGE.find((c) => c.iso2 === DEFAULT_COUNTRY_ISO2);
  }
  const upper = String(iso2).trim().toUpperCase();
  return NOTCHPAY_COVERAGE.find((c) => c.iso2 === upper);
}

/**
 * Un canal est-il réellement UTILISABLE pour ce pays sur le compte NotchPay ?
 * FAIT VALIDÉ n°6 : fail-closed double — le canal doit exister dans la
 * couverture ET être marqué servable (active=true ET live=true côté NotchPay).
 */
export function isChannelSupported(
  iso2: string | undefined | null,
  channel: string,
): boolean {
  const country = getCountryCoverage(iso2);
  if (!country) return false;
  const found = country.channels.find(
    (c) => c.code === channel.toLowerCase(),
  );
  return !!found && found.servable;
}

/** Une méthode de paiement Prisma est-elle servible via NotchPay pour ce pays ? */
export function isPaymentMethodAllowed(
  iso2: string | undefined | null,
  method: PaymentMethod,
): boolean {
  const country = getCountryCoverage(iso2);
  if (!country) return false;
  // FAIT VALIDÉ n°6 : seuls les canaux SERVABLES (active=true ET live=true)
  // rendent leur méthode disponible. Un canal présent mais inactif (ex. 'card'
  // sur le compte LIVE actuel) ne doit PAS rendre VISA_CARD/MASTERCARD
  // "autorisées" — sinon l'échec surviendrait plus tard côté NotchPay.
  return country.channels.some(
    (c) => c.servable && c.paymentMethods.includes(method),
  );
}

/**
 * Valide un numéro Mobile Money contre la couverture réelle du pays.
 * Remplace l'ancienne regex Cameroun-only codée en dur dans les DTOs.
 *
 * Accepte volontairement les DEUX saisies utilisateur :
 *   - format international : `237670000000` / `+237670000000`
 *   - format local         : `670000000` (indicatif préfixé avant test)
 * Le test porte toujours sur la forme normalisée (indicatif inclus) : un
 * numéro dont l'indicatif ne correspond pas au pays est refusé.
 *
 * @returns true si le numéro, normalisé, satisfait la regex du pays.
 */
export function validateMomoPhoneForCountry(
  iso2: string | undefined | null,
  phone: string,
): boolean {
  const country = getCountryCoverage(iso2);
  if (!country) return false;
  const momoChannels = country.channels.filter((c) => c.requiresPhone);
  if (momoChannels.length === 0) return false;
  const normalized = normalizeMomoPhoneForCountry(iso2, phone);
  if (!normalized) return false;
  return new RegExp(country.phoneRegex).test(normalized);
}

/**
 * Normalise un numéro Mobile Money en chiffres purs avec indicatif du pays
 * (SANS '+', ex. 237670000000). Sert à la VALIDATION (regex du pays) et au
 * transport frontend → backend.
 *
 * ⚠️ Ce N'EST PAS le format envoyé à NotchPay : voir `toE164MomoPhone()`
 * (format international strict AVEC '+', confirmé par le support NotchPay,
 * 2026-09) qui s'appuie sur cette fonction puis préfixe '+'.
 * Fail-closed : pays non couvert → undefined.
 */
export function normalizeMomoPhoneForCountry(
  iso2: string | undefined | null,
  phone: string | undefined | null,
): string | undefined {
  if (!phone) return undefined;
  const country = getCountryCoverage(iso2);
  if (!country) return undefined;
  const cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return undefined;
  if (cleaned.startsWith(country.dialCode)) return cleaned;
  // Numéro local (sans indicatif) : préfixe l'indicatif du pays.
  if (cleaned.length <= country.dialCode.length + 9) {
    return country.dialCode + cleaned;
  }
  return cleaned;
}

/**
 * ── FORMAT STRICT DU NUMÉRO ENVOYÉ À NOTCHPAY (fait validé par le support
 * NotchPay, 2026-09) ─────────────────────────────────────────────────────────
 * Le champ `phone` du payload `POST /payments` (initialize) doit être au
 * format international strict E.164 AVEC '+', selon l'opérateur/pays :
 *   - Cameroun (CM) : `+2376XXXXXXXX` (ex. +237670000000) ;
 *   - autres pays couverts : `+<indicatif><numéro national>`.
 *
 * Accepte volontairement toutes les saisies déjà tolérées en amont
 * (`670000000`, `237670000000`, `+237670000000`, espaces/tirets) : la
 * normalisation passe par `normalizeMomoPhoneForCountry` puis préfixe '+'.
 * Fail-closed : pays non couvert ou numéro vide → undefined (aucun guess).
 */
export function toE164MomoPhone(
  iso2: string | undefined | null,
  phone: string | undefined | null,
): string | undefined {
  const normalized = normalizeMomoPhoneForCountry(iso2, phone);
  return normalized ? `+${normalized}` : undefined;
}
