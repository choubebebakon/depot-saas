import type { CrmErrorCode } from './crm.constants';

/**
 * Contrats de données du module CRM omnicanal.
 *
 * Aucun `any` : chaque payload traversant la route est décrit ici, ce qui
 * permet au compilateur de garantir la forme de la réponse consommée par
 * l'agent IA conversationnel.
 */

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

/** Canaux supportés, alignés sur l'enum Prisma `CrmChannel`. */
export type CrmChannelName = 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER';

/** Nature de l'identifiant utilisé pour retrouver le client. */
export type CrmIdentifierKind = 'PHONE' | 'INSTAGRAM' | 'MESSENGER';

/** Identifiant de canal résolu et normalisé. */
export interface CrmIdentifier {
  readonly kind: CrmIdentifierKind;
  readonly value: string;
  readonly channel: CrmChannelName;
}

/** Contexte d'authentification issu de la résolution de `x-api-key`. */
export interface CrmKeyContext {
  readonly apiKeyId: string;
  readonly tenantId: string;
  readonly allowedChannels: readonly CrmChannelName[];
  readonly requestId: string;
}

/** Enveloppe de succès uniforme de l'API CRM. */
export interface CrmSuccessEnvelope<T> {
  readonly success: true;
  readonly requestId: string;
  readonly data: T;
}

/** Enveloppe d'erreur uniforme de l'API CRM. */
export interface CrmErrorEnvelope {
  readonly success: false;
  readonly requestId: string;
  readonly error: {
    readonly code: CrmErrorCode;
    readonly message: string;
  };
}

export type CrmEnvelope<T> = CrmSuccessEnvelope<T> | CrmErrorEnvelope;

/**
 * Paramètres CRM configurables par shop (Tenant.parametres.crm).
 *
 * Les valeurs métier (ratio de fidélité, seuil d'écart de stock, référentiel de
 * pointures) valent `null` tant que le commerçant ne les a pas renseignés :
 * le module ne substitue JAMAIS une valeur plausible à une spécification
 * absente. `configured` indique à l'agent IA s'il peut citer la règle.
 */
export interface CrmShopSettings {
  readonly channels: {
    readonly whatsapp: boolean;
    readonly instagram: boolean;
    readonly messenger: boolean;
  };
  readonly history: {
    readonly defaultLimit: number;
    readonly maxLimit: number;
  };
  readonly metaData: {
    readonly maxArrayItems: number;
    readonly appendPaths: readonly string[];
  };
  readonly loyalty: {
    readonly enabled: boolean;
    readonly configured: boolean;
    readonly pointsPerCurrencyUnit: number | null;
    readonly pointsToCurrencyRatio: number | null;
    /** Devise du shop : jamais supposée par le code (null tant que non renseignée). */
    readonly currency: string | null;
  };
  readonly shrinkageAlert: {
    readonly enabled: boolean;
    readonly configured: boolean;
    readonly maxDeltaPercent: number | null;
    readonly windowDays: number | null;
  };
  readonly boutique: {
    readonly sizeSystem: 'EU' | 'UK' | 'US' | null;
    readonly sizeSystemConfigured: boolean;
  };
  /** Renseigné quand des valeurs du JSON ont été ignorées (types invalides). */
  readonly diagnostics: readonly string[];
}

/** Ligne d'historique d'achat, montant sérialisé sans artefact de flottant. */
export interface CrmSaleSummary {
  readonly id: string;
  readonly reference: string;
  readonly date: string;
  readonly statut: string;
  readonly modePaiement: string;
  /** Montant formaté en chaîne (2 décimales) — jamais un flottant brut. */
  readonly total: string;
}

/** Page d'historique bornée avec curseur opaque (keyset pagination). */
export interface CrmPurchaseHistoryPage {
  readonly items: readonly CrmSaleSummary[];
  readonly limit: number;
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

/** Programme de fidélité du client, tel qu'enregistré (aucun calcul inventé). */
export interface CrmLoyaltySnapshot {
  readonly points: number;
  readonly niveau: string;
  readonly totalDepense: string;
}

/** Solde de consigne auditable par type de contenant. */
export interface CrmConsigneSnapshot {
  readonly typeConsigne: string;
  readonly quantiteEnCirculation: number;
  readonly valeurUnitaire: string;
  readonly montantEnCirculation: string;
}

/** Profil client renvoyé par la route (projection minimale). */
export interface CrmCustomerProfile {
  readonly id: string;
  readonly nom: string;
  readonly telephone: string | null;
  readonly instagramId: string | null;
  readonly messengerId: string | null;
  readonly depotId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Résultat `found: true`. */
export interface CrmCustomerFound {
  readonly found: true;
  readonly customer: CrmCustomerProfile;
  readonly metaData: JsonObject;
  /** Vue aplatie (notation pointée) directement exploitable par le LLM. */
  readonly metaDataFlat: Readonly<Record<string, string>>;
  readonly history: CrmPurchaseHistoryPage;
  readonly loyalty: CrmLoyaltySnapshot | null;
  readonly consignes: readonly CrmConsigneSnapshot[];
  readonly shopSettings: CrmShopSettings;
}

/** Motif d'absence, pour que l'agent IA sache quoi demander au client. */
export type CrmMissingReason = 'UNKNOWN_IDENTIFIER' | 'MISSING_DISPLAY_NAME';

/** Résultat `found: false` : signal explicite de collecte de données. */
export interface CrmCustomerNotFound {
  readonly found: false;
  readonly reason: CrmMissingReason;
  readonly channel: CrmChannelName;
  /** Empreinte tronquée de l'identifiant : corrélable sans exposer la PII. */
  readonly identifierRef: string;
  /** Consigne destinée à l'orchestrateur IA. */
  readonly nextAction: string;
  readonly shopSettings: CrmShopSettings;
}

export type CrmCustomerLookup = CrmCustomerFound | CrmCustomerNotFound;

/** Entrée de `upsertCustomerFromIA`. Aucun `tenantId` fourni par le client. */
export interface UpsertCustomerInput {
  /** Tenant résolu depuis `x-api-key`, jamais depuis le body. */
  readonly tenantId: string;
  readonly identifier: CrmIdentifier;
  /** Identifiants complémentaires rattachés si les colonnes sont libres. */
  readonly extraIdentifiers?: readonly CrmIdentifier[];
  readonly displayName?: string;
  readonly depotId?: string | null;
  readonly metaDataPatch?: JsonObject;
  readonly requestId: string;
}

/** Résultat typé de `upsertCustomerFromIA`. */
export interface UpsertCustomerResult {
  readonly created: boolean;
  readonly customer: CrmCustomerProfile;
  readonly metaData: JsonObject;
  readonly mergedPaths: readonly string[];
}

