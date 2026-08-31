export const API_ERROR_KIND = Object.freeze({
  AUTHENTICATION: 'authentication',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION: 'validation',
  SERVER: 'server',
  NETWORK: 'network',
  UNKNOWN: 'unknown',
});

function readMessage(data) {
  if (!data) return null;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (typeof data === 'object') {
    const message = data.message;
    if (Array.isArray(message)) return message.filter(Boolean).join(', ');
    if (typeof message === 'string' && message.trim()) return message.trim();
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
  }
  return null;
}

export function normalizeApiError(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const message = readMessage(data);
  let kind = API_ERROR_KIND.UNKNOWN;
  let userMessage = message || 'Une erreur inattendue est survenue.';

  if (!error?.response && error?.request) {
    kind = API_ERROR_KIND.NETWORK;
    userMessage = 'Connexion au serveur impossible. Vérifiez votre connexion et réessayez.';
  } else if (status === 401) {
    kind = API_ERROR_KIND.AUTHENTICATION;
    userMessage = message || 'Votre session a expiré. Veuillez vous reconnecter.';
  } else if (status === 403) {
    kind = API_ERROR_KIND.FORBIDDEN;
    userMessage = message || 'Vous n’avez pas les permissions nécessaires pour cette action.';
  } else if (status === 404) {
    kind = API_ERROR_KIND.NOT_FOUND;
    userMessage = message || 'La ressource demandée est introuvable.';
  } else if (status === 422 || status === 400) {
    kind = API_ERROR_KIND.VALIDATION;
    userMessage = message || 'Les données fournies sont invalides. Vérifiez le formulaire.';
  } else if (status >= 500) {
    kind = API_ERROR_KIND.SERVER;
    userMessage = 'Le serveur rencontre un problème. Réessayez dans quelques instants.';
  }

  return {
    status,
    kind,
    message: userMessage,
    details: data,
    original: error,
  };
}

export function getApiErrorMessage(error, fallback) {
  return normalizeApiError(error).message || fallback || 'Une erreur est survenue.';
}
