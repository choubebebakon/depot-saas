import {
  CRM_META_DATA_MAX_BYTES,
  CRM_META_DATA_MAX_DEPTH,
  CRM_META_DATA_MAX_KEYS,
} from './crm.constants';
import { crmErrors } from './crm-errors';
import type { JsonObject, JsonValue } from './crm.types';

/**
 * Fusion structurelle (deep merge) du champ `metaData` des clients.
 *
 * STRATÉGIE DE FUSION DES TABLEAUX (règle explicite, pas de comportement
 * implicite) :
 *  - Par défaut un tableau est REMPLACÉ par celui du patch. C'est le choix sûr :
 *    une concaténation systématique ferait croître les tableaux sans borne à
 *    chaque appel de l'agent IA (mémoire et coût de sérialisation non bornés).
 *  - Un tableau n'est CONCATÉNÉ que si son chemin (notation pointée, ex.
 *    « preferences.couleurs ») est listé dans `appendPaths`, lui-même issu des
 *    paramètres du shop. La concaténation déduplique par valeur JSON canonique
 *    (la valeur la plus récente écrase la précédente) et ne conserve que les
 *    `maxArrayItems` dernières entrées.
 *  - `null` écrase explicitement la valeur précédente : JSON ne sait pas
 *    exprimer « clé absente », donc `null` est traité comme une écriture.
 *
 * Les objets sont fusionnés récursivement ; les scalaires du patch gagnent.
 */

export interface DeepMergeOptions {
  /** Chemins pointés dont les tableaux sont concaténés au lieu d'être remplacés. */
  readonly appendPaths: readonly string[];
  /** Nombre maximal d'éléments conservés pour un tableau concaténé. */
  readonly maxArrayItems: number;
}

export interface DeepMergeResult {
  readonly merged: JsonObject;
  /** Chemins effectivement touchés (utile pour l'audit et la réponse à l'IA). */
  readonly appliedPaths: readonly string[];
}

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalise la valeur JSONB lue en base. Toute valeur inattendue (tableau,
 * scalaire, null) devient un objet vide : le service peut donc toujours
 * fusionner sans test de nullité préalable.
 */
export function toJsonObject(value: unknown): JsonObject {
  if (!isPlainObject(value)) return {};
  return value;
}

function measureDepth(value: JsonValue, current: number): number {
  if (!isPlainObject(value) && !Array.isArray(value)) return current;
  const children: JsonValue[] = Array.isArray(value)
    ? value
    : Object.values(value);
  if (children.length === 0) return current;
  return children.reduce<number>(
    (max, child) => Math.max(max, measureDepth(child, current + 1)),
    current,
  );
}

function countKeys(value: JsonValue): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((total, item) => total + countKeys(item), 0);
  }
  if (isPlainObject(value)) {
    return Object.values(value).reduce<number>(
      (total, child) => total + 1 + countKeys(child),
      0,
    );
  }
  return 0;
}

/**
 * Bornes anti-abus : le patch vient d'un webhook, donc d'une entrée non fiable.
 * On refuse avant d'écrire quoi que ce soit en base.
 */
export function assertPatchWithinBounds(patch: JsonObject): void {
  let serialized: string | undefined;

  // JSON.stringify lève une TypeError sur un BigInt ou une structure cyclique :
  // on la convertit en erreur métier, jamais en 500 opaque.
  try {
    serialized = JSON.stringify(patch);
  } catch {
    throw crmErrors.validation('metaData : contenu non sérialisable.');
  }

  if (serialized === undefined) {
    throw crmErrors.validation('metaData : contenu non sérialisable.');
  }

  if (Buffer.byteLength(serialized, 'utf8') > CRM_META_DATA_MAX_BYTES) {
    throw crmErrors.validation(
      `metaData : contenu trop volumineux (maximum ${CRM_META_DATA_MAX_BYTES} octets).`,
    );
  }

  if (measureDepth(patch, 1) > CRM_META_DATA_MAX_DEPTH) {
    throw crmErrors.validation(
      `metaData : profondeur maximale dépassée (maximum ${CRM_META_DATA_MAX_DEPTH} niveaux).`,
    );
  }

  const keys = countKeys(patch);
  if (keys > CRM_META_DATA_MAX_KEYS) {
    throw crmErrors.validation(
      `metaData : trop de clés (maximum ${CRM_META_DATA_MAX_KEYS}).`,
    );
  }
}

/**
 * Fusionne `patch` dans `base` sans écraser les branches absentes du patch.
 */
export function deepMergeMetaData(
  base: JsonObject,
  patch: JsonObject,
  options: DeepMergeOptions,
): DeepMergeResult {
  assertPatchWithinBounds(patch);
  const appliedPaths: string[] = [];
  const merged = mergeObjects(base, patch, '', options, appliedPaths);
  return { merged, appliedPaths };
}

function mergeObjects(
  base: JsonObject,
  patch: JsonObject,
  prefix: string,
  options: DeepMergeOptions,
  appliedPaths: string[],
): JsonObject {
  const result: JsonObject = { ...base };

  for (const [key, patchValue] of Object.entries(patch)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const baseValue = result[key];

    if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
      result[key] = mergeObjects(
        baseValue,
        patchValue,
        path,
        options,
        appliedPaths,
      );
      appliedPaths.push(path);
      continue;
    }

    if (
      Array.isArray(patchValue) &&
      Array.isArray(baseValue) &&
      options.appendPaths.includes(path)
    ) {
      result[key] = appendArray(baseValue, patchValue, options.maxArrayItems);
      appliedPaths.push(path);
      continue;
    }

    // Scalaire, tableau (remplacement par défaut) ou null explicite.
    result[key] = patchValue;
    appliedPaths.push(path);
  }

  return result;
}

function appendArray(
  base: readonly JsonValue[],
  patch: readonly JsonValue[],
  maxArrayItems: number,
): JsonValue[] {
  // Déduplication par valeur JSON canonique : la dernière occurrence gagne,
  // la position de première apparition est conservée (historique lisible).
  const byValue = new Map<string, JsonValue>();

  for (const item of [...base, ...patch]) {
    byValue.set(JSON.stringify(item) ?? 'null', item);
  }

  const ordered = [...byValue.values()];
  const capped = Math.max(1, Math.trunc(maxArrayItems));
  return ordered.slice(-capped);
}

/**
 * Vue aplatie (notation pointée) du metaData : directement injectable dans le
 * contexte de l'agent IA, sans qu'il ait à parcourir l'arbre JSON.
 */
export function flattenMetaData(metaData: JsonObject): Record<string, string> {
  const flat: Record<string, string> = {};

  const walk = (value: JsonValue, path: string): void => {
    if (isPlainObject(value)) {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        flat[path] = '{}';
        return;
      }
      for (const [key, child] of entries) {
        walk(child, path ? `${path}.${key}` : key);
      }
      return;
    }

    if (Array.isArray(value)) {
      flat[path] = JSON.stringify(value);
      return;
    }

    flat[path] = value === null ? 'null' : String(value);
  };

  walk(metaData, '');
  return flat;
}