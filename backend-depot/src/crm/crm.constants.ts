/**
 * Constantes techniques du module CRM omnicanal.
 *
 * Aucune règle métier chiffrée ici : ratios de fidélité, seuils de perte/vol,
 * référentiels de tailles et montants de consigne sont lus depuis les
 * paramètres du tenant (voir crm-settings.service.ts). Ce fichier ne contient
 * que des noms d'en-têtes HTTP, des codes d'erreur stables et des bornes de
 * sécurité techniques (anti-abus), qui ne dépendent d'aucun métier.
 */

/** Clé d'API machine-à-machine, résolue en tenantId côté serveur. */
export const CRM_API_KEY_HEADER = 'x-api-key';

/** Signature HMAC-SHA256 portée par les webhooks Meta. */
export const CRM_META_SIGNATURE_HEADER = 'x-hub-signature-256';

/** Identifiant de corrélation repris dans les logs, les réponses et les erreurs. */
export const CRM_REQUEST_ID_HEADER = 'x-request-id';

/** Préfixe des clés générées, pour l'identification humaine en console. */
export const CRM_API_KEY_PREFIX = 'gsk_crm_';

/** Longueur du préfixe conservé en clair (identification / révocation). */
export const CRM_API_KEY_PREFIX_LENGTH = 16;

/**
 * Forme attendue d'une clé : `gsk_crm_` suivi de 43 caractères base64url
 * (32 octets d'entropie cryptographique). Le format est validé AVANT toute
 * requête base de données, pour ne pas transformer la route en oracle.
 */
export const CRM_API_KEY_PATTERN = /^gsk_crm_[A-Za-z0-9_-]{43}$/;

/** Mode de vérification de la signature des webhooks Meta. */
export const CrmMetaSignatureMode = {
  /** Aucune vérification : architecture orchestrateur interne uniquement. */
  OFF: 'off',
  /** Vérifiée si l'en-tête est présent (défaut prudent). */
  OPTIONAL: 'optional',
  /** Exigée : la route est exposée directement aux webhooks Meta. */
  REQUIRED: 'required',
} as const;

export type CrmMetaSignatureMode =
  (typeof CrmMetaSignatureMode)[keyof typeof CrmMetaSignatureMode];

/** Bornes techniques anti-abus du champ metaData (indépendantes du métier). */
export const CRM_META_DATA_MAX_BYTES = 32 * 1024;
export const CRM_META_DATA_MAX_DEPTH = 5;
export const CRM_META_DATA_MAX_KEYS = 200;

/** Bornes techniques de pagination (le défaut métier vient des paramètres du shop). */
export const CRM_HISTORY_MIN_LIMIT = 1;
export const CRM_HISTORY_MAX_LIMIT = 50;

/** Bornes techniques des identifiants de canal. */
export const CRM_MAX_PHONE_LENGTH = 24;
export const CRM_MAX_CHANNEL_ID_LENGTH = 128;

/** Intervalle minimal entre deux mises à jour de lastUsedAt (écriture évitée). */
export const CRM_LAST_USED_TOUCH_MS = 5 * 60 * 1000;

/** Tentatives en isolation Serializable avant abandon (conflits de fusion). */
export const CRM_SERIALIZABLE_RETRIES = 3;

/** Codes d'erreur stables renvoyés dans `error.code`. */
export const CRM_ERROR_CODES = {
  VALIDATION_ERROR: 'CRM_VALIDATION_ERROR',
  UNAUTHORIZED: 'CRM_UNAUTHORIZED',
  CHANNEL_FORBIDDEN: 'CRM_CHANNEL_FORBIDDEN',
  TENANT_MISMATCH: 'CRM_TENANT_MISMATCH',
  NOT_CONFIGURED: 'CRM_NOT_CONFIGURED',
  CUSTOMER_NAME_REQUIRED: 'CRM_CUSTOMER_NAME_REQUIRED',
  IDENTITY_CONFLICT: 'CRM_IDENTITY_CONFLICT',
  NOT_FOUND: 'CRM_NOT_FOUND',
  RATE_LIMITED: 'CRM_RATE_LIMITED',
  INTERNAL_ERROR: 'CRM_INTERNAL_ERROR',
} as const;

export type CrmErrorCode =
  (typeof CRM_ERROR_CODES)[keyof typeof CRM_ERROR_CODES];
