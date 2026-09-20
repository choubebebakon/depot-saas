/**
 * Configuration du module Meta — chargée UNE fois à l'instanciation, jamais à
 * chaque requête (évite les lectures d'environnement cachées dans le code de
 * service). Les variables sensibles ne sont jamais loggées.
 *
 * ⚠�? Points à confirmer (voir PARTIE 5, « Hypothèses ») :
 * - META_APP_ID / META_APP_SECRET : à créer dans le dashboard Meta du projet ;
 * - META_GRAPH_VERSION : v21.0 par défaut ici, à aligner sur la version
 *   réellement choisie pour Embedded Signup v4 ;
 * - le template de configuration (durée de jeton) est un réglage dashboard,
 *   invisible depuis le code — signalé, pas inventé.
 */
export interface MetaConfig {
  readonly appId: string | null;
  readonly appSecret: string | null;
  readonly verifyToken: string | null;
  readonly configId: string | null;
  readonly graphVersion: string;
  readonly isProduction: boolean;
  readonly requiredScopes: readonly string[];
}

/** Token d'injection NestJS portant la configuration Meta chargée au boot. */
export const META_CONFIG = Symbol('META_CONFIG');

export function loadMetaConfig(): MetaConfig {
  return {
    appId: process.env.META_APP_ID?.trim() || null,
    appSecret: process.env.META_APP_SECRET?.trim() || null,
    verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || null,
    configId: process.env.META_CONFIG_ID?.trim() || null,
    graphVersion: (process.env.META_GRAPH_VERSION ?? 'v21.0').replace(/^v/, ''),
    isProduction: process.env.NODE_ENV === 'production',
    requiredScopes: [
      'business_management',
      'whatsapp_business_management',
      'whatsapp_business_messaging',
      'whatsapp_business_manage_events',
    ],
  };
}

/** Vérifie que la configuration minimale est présente (journalisé au boot). */
export function assertMetaConfig(config: MetaConfig): string[] {
  const missing: string[] = [];
  if (!config.appId) missing.push('META_APP_ID');
  if (!config.appSecret) missing.push('META_APP_SECRET');
  if (!config.verifyToken) missing.push('META_WEBHOOK_VERIFY_TOKEN');
  return missing;
}
