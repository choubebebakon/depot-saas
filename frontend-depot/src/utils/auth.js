/**
 * Récupère le jeton d'authentification depuis le localStorage.
 * Centralise l'accès pour éviter les incohérences entre les clés.
 * @returns {string|null} Le jeton d'authentification
 */
export function getAuthToken() {
  return localStorage.getItem('depot_token') || localStorage.getItem('access_token');
}
