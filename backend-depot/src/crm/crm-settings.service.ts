import { Injectable } from '@nestjs/common';
import { CRM_HISTORY_MAX_LIMIT, CRM_HISTORY_MIN_LIMIT } from './crm.constants';
import { isPlainObject } from './crm-deep-merge';
import type { CrmShopSettings, JsonObject } from './crm.types';

/**
 * Paramètres CRM configurables PAR SHOP.
 *
 * Contrainte appliquée : aucune règle métier chiffrée n'est codée en dur dans
 * le module. Le ratio de conversion des points de fidélité, le seuil d'alerte
 * de perte/vol et le référentiel de tailles sont lus dans
 * `Tenant.parametres.crm` et valent `null` tant que le commerçant ne les a pas
 * renseignés. Le module ne substitue jamais une valeur « plausible » à une
 * spécification absente : il expose `configured: false` pour que l'agent IA
 * sache qu'il ne doit pas énoncer de règle.
 *
 * Les seules valeurs de repli de ce fichier sont TECHNIQUES (bornes de
 * pagination, taille max d'un tableau de métadonnées) : elles ne portent aucune
 * sémantique métier et restent surchargeables par le shop.
 */

/** Namespace du module dans `Tenant.parametres` (JSONB). */
export const CRM_SETTINGS_NAMESPACE = 'crm';

/** Replis techniques, surchargeables par `Tenant.parametres.crm`. */
export const CRM_SETTINGS_FALLBACKS = {
  /** Nombre de ventes par page quand le shop ne précise rien. */
  historyDefaultLimit: 20,
  /** Plafond absolu de pagination (borne de sécurité du serveur). */
  historyMaxLimit: CRM_HISTORY_MAX_LIMIT,
  /** Éléments conservés par tableau concaténé dans metaData. */
  metaDataMaxArrayItems: 100,
  /** Plafond absolu de `maxArrayItems` (protection mémoire). */
  metaDataMaxArrayItemsCeiling: 1000,
} as const;

@Injectable()
export class CrmSettingsService {
  /**
   * Lit et normalise les paramètres CRM d'un shop. Fonction pure : testable
   * sans base de données, et sans effet de bord.
   */
  resolve(parametres: unknown): CrmShopSettings {
    const diagnostics: string[] = [];
    const root: JsonObject = isPlainObject(parametres) ? parametres : {};
    const crm = this.object(root[CRM_SETTINGS_NAMESPACE]);

    const channels = this.object(crm.channels);
    const history = this.object(crm.history);
    const metaData = this.object(crm.metaData);
    const loyalty = this.object(crm.loyalty);
    const shrinkage = this.object(crm.shrinkageAlert);
    const boutique = this.object(crm.boutique);

    const historyMaxLimit = this.clampInt(
      this.number(
        history.maxLimit,
        CRM_SETTINGS_FALLBACKS.historyMaxLimit,
        'crm.history.maxLimit',
        diagnostics,
      ),
      CRM_HISTORY_MIN_LIMIT,
      CRM_HISTORY_MAX_LIMIT,
      CRM_SETTINGS_FALLBACKS.historyMaxLimit,
    );

    const historyDefaultLimit = this.clampInt(
      this.number(
        history.defaultLimit,
        CRM_SETTINGS_FALLBACKS.historyDefaultLimit,
        'crm.history.defaultLimit',
        diagnostics,
      ),
      CRM_HISTORY_MIN_LIMIT,
      historyMaxLimit,
      CRM_SETTINGS_FALLBACKS.historyDefaultLimit,
    );

    const pointsPerCurrencyUnit = this.number(
      loyalty.pointsPerCurrencyUnit,
      null,
      'crm.loyalty.pointsPerCurrencyUnit',
      diagnostics,
    );
    const pointsToCurrencyRatio = this.number(
      loyalty.pointsToCurrencyRatio,
      null,
      'crm.loyalty.pointsToCurrencyRatio',
      diagnostics,
    );
    const maxDeltaPercent = this.number(
      shrinkage.maxDeltaPercent,
      null,
      'crm.shrinkageAlert.maxDeltaPercent',
      diagnostics,
    );
    const windowDays = this.number(
      shrinkage.windowDays,
      null,
      'crm.shrinkageAlert.windowDays',
      diagnostics,
    );
    const sizeSystem = this.sizeSystem(boutique.sizeSystem, diagnostics);

    return {
      channels: {
        whatsapp: this.boolean(
          channels.whatsapp,
          true,
          'crm.channels.whatsapp',
          diagnostics,
        ),
        instagram: this.boolean(
          channels.instagram,
          true,
          'crm.channels.instagram',
          diagnostics,
        ),
        messenger: this.boolean(
          channels.messenger,
          true,
          'crm.channels.messenger',
          diagnostics,
        ),
      },
      history: {
        defaultLimit: historyDefaultLimit,
        maxLimit: historyMaxLimit,
      },
      metaData: {
        maxArrayItems: this.clampInt(
          this.number(
            metaData.maxArrayItems,
            CRM_SETTINGS_FALLBACKS.metaDataMaxArrayItems,
            'crm.metaData.maxArrayItems',
            diagnostics,
          ),
          1,
          CRM_SETTINGS_FALLBACKS.metaDataMaxArrayItemsCeiling,
          CRM_SETTINGS_FALLBACKS.metaDataMaxArrayItems,
        ),
        appendPaths: this.stringList(
          metaData.appendPaths,
          'crm.metaData.appendPaths',
          diagnostics,
        ),
      },
      loyalty: {
        enabled: this.boolean(loyalty.enabled, false, 'crm.loyalty.enabled', diagnostics),
        // Une règle de fidélité n'est « configurée » que si le ratio de gain ET
        // celui de conversion sont réellement renseignés par le commerçant.
        configured:
          pointsPerCurrencyUnit !== null && pointsToCurrencyRatio !== null,
        pointsPerCurrencyUnit,
        pointsToCurrencyRatio,
        currency: this.optionalString(
          loyalty.currency,
          'crm.loyalty.currency',
          diagnostics,
        ),
      },
      shrinkageAlert: {
        enabled: this.boolean(
          shrinkage.enabled,
          false,
          'crm.shrinkageAlert.enabled',
          diagnostics,
        ),
        configured: maxDeltaPercent !== null,
        maxDeltaPercent,
        windowDays,
      },
      boutique: {
        sizeSystem,
        sizeSystemConfigured: sizeSystem !== null,
      },
      diagnostics,
    };
  }

  private object(value: unknown): JsonObject {
    return isPlainObject(value) ? value : {};
  }

  private number(
    value: unknown,
    fallback: number | null,
    path: string,
    diagnostics: string[],
  ): number | null {
    if (value === undefined || value === null || value === '') return fallback;

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    // Les interfaces d'administration sérialisent souvent les nombres en
    // chaînes : on accepte une chaîne strictement numérique, rien d'autre.
    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) return parsed;
    }

    diagnostics.push(`${path}: valeur numérique attendue (ignorée).`);
    return fallback;
  }

  private boolean(
    value: unknown,
    fallback: boolean,
    path: string,
    diagnostics: string[],
  ): boolean {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    diagnostics.push(`${path}: booléen attendu (ignoré).`);
    return fallback;
  }

  private optionalString(
    value: unknown,
    path: string,
    diagnostics: string[],
  ): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    diagnostics.push(`${path}: chaîne non vide attendue (ignorée).`);
    return null;
  }

  private stringList(
    value: unknown,
    path: string,
    diagnostics: string[],
  ): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
      diagnostics.push(`${path}: tableau de chemins attendu (ignoré).`);
      return [];
    }

    const paths = value.filter(
      (item): item is string => typeof item === 'string' && item.trim() !== '',
    );

    if (paths.length !== value.length) {
      diagnostics.push(`${path}: entrées non textuelles ignorées.`);
    }

    return paths.map((item) => item.trim());
  }

  private sizeSystem(
    value: unknown,
    diagnostics: string[],
  ): 'EU' | 'UK' | 'US' | null {
    if (value === undefined || value === null) return null;
    if (value === 'EU' || value === 'UK' || value === 'US') return value;
    diagnostics.push(
      'crm.boutique.sizeSystem: référentiel inconnu (EU|UK|US attendu, ignoré).',
    );
    return null;
  }

  private clampInt(
    value: number | null,
    min: number,
    max: number,
    fallback: number,
  ): number {
    if (value === null) return Math.min(Math.max(fallback, min), max);
    const truncated = Math.trunc(value);
    return Math.min(Math.max(truncated, min), max);
  }
}

/**
 * Accès SANS injection de dépendance à la résolution des paramètres CRM.
 *
 * `resolve()` est une fonction pure et sans état : un service métier (ex.
 * supermarché) peut donc la consommer sans dépendre du conteneur Nest, ce qui
 * évite de propager un paramètre de constructeur dans toute une chaîne
 * d'héritage de services (SupermarcheService ← SupermarchePosService ←
 * ProductionSupermarcheStockService). Une instance partagée suffit.
 *
 * Source unique de vérité : la carte « CRM Omnicanal » des Paramètres et les
 * modules métier lisent exactement le même JSON, avec les mêmes diagnostics.
 */
const shopSettingsResolver = new CrmSettingsService();

export function resolveCrmShopSettings(parametres: unknown): CrmShopSettings {
  return shopSettingsResolver.resolve(parametres);
}