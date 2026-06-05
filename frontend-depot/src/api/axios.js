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

function getActiveDepotId() {
  const depotId = localStorage.getItem('depot_actif_id');
  return depotId && depotId !== 'all' ? depotId : null;
}

function pickDepotIdFromRequest(config) {
  const method = (config.method || 'get').toLowerCase();
  if (['get', 'delete'].includes(method)) {
    const depotId = config.params?.depotId;
    return typeof depotId === 'string' && depotId.trim() && depotId !== 'all' ? depotId : null;
  }
  const depotId = config.data?.depotId;
  return typeof depotId === 'string' && depotId.trim() && depotId !== 'all' ? depotId : null;
}

api.defaults.headers.post['Content-Type'] = 'application/json';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('depot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const depotId = pickDepotIdFromRequest(config) || getActiveDepotId();
  if (!depotId || shouldSkipDepotInjection(config.url || '')) {
    return config;
  }

  config.headers['X-Depot-Id'] = depotId;

  if (['get', 'delete'].includes((config.method || 'get').toLowerCase())) {
    config.params = { ...(config.params || {}), depotId: config.params?.depotId ?? depotId };
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
  refreshSubscribers.map(cb => cb(token));
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
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

      if (isLoginRequest || isRefreshRequest) {
        if (!isLoginRequest) {
          localStorage.removeItem('depot_token');
          localStorage.removeItem('depot_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
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
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

registerQuotaForbiddenInterceptor(api);

/**
 * Construit une URL dynamique pour un métier et une ressource donnés.
 * @param {string} metier - Identifiant du métier (ex: 'supermarche', 'pharmacie')
 * @param {string} resource - Chemin de la ressource (ex: '/stocks', '/rayons')
 * @returns {string} URL complète (ex: '/api/supermarche/stocks')
 */
export function buildUrl(metier, resource) {
  const base = api.defaults.baseURL.replace(/\/api\/v1$/, '').replace(/\/api\/v1\/$/, '');
  const metierSlug = metier.toLowerCase().replace(/_/g, '-');
  const path = resource.startsWith('/') ? resource : `/${resource}`;
  return `${base}/api/${metierSlug}${path}`;
}

export default api;
