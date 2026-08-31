import axios from 'axios';
import { registerQuotaForbiddenInterceptor } from './api-interceptor';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const GLOBAL_DEPOT_FREE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/me',
  '/depots',
  '/tenants',
  '/settings',
];

function shouldSkipDepotInjection(url = '') {
  return GLOBAL_DEPOT_FREE_PATHS.some((path) => url.startsWith(path));
}

/**
 * Le dépôt actif est un choix d'interface, pas une preuve d'autorisation.
 * Le backend valide toujours ce choix contre le JWT + tenant avant d'ouvrir
 * le scope Prisma. localStorage ne constitue donc jamais une frontière de
 * sécurité.
 */
function getActiveDepotId() {
  const depotId = localStorage.getItem('depot_actif_id');
  return depotId && depotId !== 'all' ? depotId : null;
}

function pickDepotIdFromRequest(config) {
  const method = (config.method || 'get').toLowerCase();

  if (['get', 'delete'].includes(method)) {
    const depotId = config.params?.depotId;
    return typeof depotId === 'string' && depotId.trim() && depotId !== 'all'
      ? depotId
      : null;
  }

  if (config.data instanceof FormData) {
    const depotId = config.data.get('depotId');
    return typeof depotId === 'string' && depotId.trim() && depotId !== 'all'
      ? depotId
      : null;
  }

  const depotId = config.data?.depotId;
  return typeof depotId === 'string' && depotId.trim() && depotId !== 'all'
    ? depotId
    : null;
}

api.defaults.headers.post['Content-Type'] = 'application/json';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('depot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // IMPORTANT : le tenantId n'est plus envoyé depuis localStorage.
  // L'identité du tenant est exclusivement déterminée par le JWT côté
  // backend. Un éventuel x-tenant-id fourni par un client ne doit jamais
  // pouvoir changer le contexte de sécurité.
  const depotId = pickDepotIdFromRequest(config) || getActiveDepotId();
  if (!depotId || shouldSkipDepotInjection(config.url || '')) {
    return config;
  }

  // x-depot-id sert uniquement à demander un changement de scope.
  // Le backend vérifie que ce dépôt appartient au tenant authentifié et que
  // le rôle de l'utilisateur autorise ce changement.
  config.headers['X-Depot-Id'] = depotId;

  if (['get', 'delete'].includes((config.method || 'get').toLowerCase())) {
    const existingDepotId = config.params?.depotId;
    const finalDepotId =
      typeof existingDepotId === 'string' && existingDepotId.trim()
        ? existingDepotId
        : depotId;
    config.params = { ...(config.params || {}), depotId: finalDepotId };
    return config;
  }

  if (config.data instanceof FormData) {
    if (!config.data.has('depotId')) {
      config.data.append('depotId', depotId);
    }
    return config;
  }

  if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
    config.data = { ...config.data, depotId: config.data.depotId ?? depotId };
  }

  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 402) {
      window.dispatchEvent(new CustomEvent('saas-paywall-locked'));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      const isRefreshRequest = originalRequest.url?.endsWith('/auth/refresh');

      if (isLoginRequest || isRefreshRequest) {
        if (!isLoginRequest) {
          localStorage.removeItem('depot_token');
          localStorage.removeItem('depot_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const token = data.access_token || data.accessToken;
        localStorage.setItem('depot_token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;

        onRefreshed(token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (err) {
        isRefreshing = false;
        localStorage.removeItem('depot_token');
        localStorage.removeItem('depot_user');
        onRefreshed(null);
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

registerQuotaForbiddenInterceptor(api);

/**
 * Construit une URL dynamique pour un métier et une ressource donnés.
 * @param {string} metier - Identifiant du métier (ex: 'supermarche', 'pharmacie')
 * @param {string} resource - Chemin de la ressource (ex: '/stocks', '/rayons')
 * @returns {string} URL complète
 */
export function buildUrl(metier, resource) {
  const base = api.defaults.baseURL
    .replace(/\/api\/v1$/, '')
    .replace(/\/api\/v1\/$/, '');
  const metierSlug = metier.toLowerCase().replace(/_/g, '-');
  const path = resource.startsWith('/') ? resource : `/${resource}`;
  return `${base}/api/${metierSlug}${path}`;
}

export default api;
