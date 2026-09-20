/**
 * Résout une URL de fichier servie par le backend (ex: `/uploads/avatars/x.png`)
 * en URL absolue pointant vers l'origine de l'API. Les fichiers statiques sont
 * montés sur le serveur backend, pas sur le serveur frontend (Vite/CDN) :
 * une URL relative casserait donc l'affichage dès que les origines diffèrent.
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1')
  .replace(/\/api\/v\d+\/?$/, '')
  .replace(/\/$/, '');

export function resolveFileUrl(url) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default resolveFileUrl;
