import axios from 'axios';
import localforage from 'localforage';
import { registerQuotaForbiddenInterceptor } from './api-interceptor';
import { normalizeApiError } from '../shared/utils/apiError';
import { generateId } from '../utils/offline';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const offlineQueue = localforage.createInstance({
  name: 'GesTock',
  storeName: 'syncQueue',
});
const MAX_OFFLINE_QUEUE_SIZE = 100;
const GLOBAL_DEPOT_FREE_PATHS = ['/auth/login', '/auth/register', '/auth/me', '/depots', '/tenants', '/settings'];

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
  if (config.data instanceof FormData) {
    const depotId = config.data.get('depotId');
    return typeof depotId === 'string' && depotId.trim() && depotId !== 'all' ? depotId : null;
  }
  const depotId = config.data?.depotId;
  return typeof depotId === 'string' && depotId.trim() && depotId !== 'all' ? depotId : null;
}

function isReceptionCreate(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  return method === 'post' && /\/fournisseurs\/receptions\/?$/.test(url);
}

function getOfflineIdentity() {
  try {
    const rawUser = localStorage.getItem('depot_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const userId = user?.id || user?.userId || null;
    const tenantId = user?.tenantId || user?.tenant?.id || null;
    const depotId = getActiveDepotId();
    if (!userId || !tenantId || !depotId) return null;
    return { userId: String(userId), tenantId: String(tenantId), depotId: String(depotId) };
  } catch {
    return null;
  }
}

async function queueReceptionWhileOffline(config) {
  const identity = getOfflineIdentity();
  if (!identity) {
    throw new Error('Impossible de mettre la réception hors ligne en file sans contexte utilisateur/tenant/dépôt.');
  }

  const keys = await offlineQueue.keys();
  if (keys.length >= MAX_OFFLINE_QUEUE_SIZE) {
    throw new Error('La file hors ligne a atteint sa limite. Reconnectez-vous pour synchroniser les actions en attente.');
  }

  const id = generateId();
  const timestamp = new Date().toISOString();
  const data = config.data instanceof FormData ? null : config.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('La réception hors ligne nécessite une charge JSON valide.');
  }

  await offlineQueue.setItem(id, {
    id,
    method: 'post',
    url: config.url,
    data,
    timestamp,
    identity,
    status: 'pending',
  });

  window.dispatchEvent(new CustomEvent('gestock:offline-queued', {
    detail: { id, type: 'reception', timestamp },
  }));

  return { id, timestamp };
}

api.defaults.headers.post['Content-Type'] = 'application/json';

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('depot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Une même requête POST doit conserver la même clé pendant les retries Axios.
  // Le backend utilise cette clé pour rendre la création d'une réception idempotente.
  if (isReceptionCreate(config) && !config.headers['X-Idempotency-Key']) {
    config.headers['X-Idempotency-Key'] = crypto.randomUUID();
  }

  const depotId = pickDepotIdFromRequest(config) || getActiveDepotId();
  if (depotId && !shouldSkipDepotInjection(config.url || '')) {
    config.headers['X-Depot-Id'] = depotId;
    if (['get', 'delete'].includes((config.method || 'get').toLowerCase())) {
      config.params = { ...(config.params || {}), depotId: config.params?.depotId || depotId };
    } else if (config.data instanceof FormData) {
      if (!config.data.has('depotId')) config.data.append('depotId', depotId);
    } else if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
      config.data = { ...config.data, depotId: config.data.depotId ?? depotId };
    }
  }

  // Seule la création de réception est automatiquement mise en file ici :
  // son endpoint backend est idempotent et rejouable avec X-Idempotency-Key.
  // Nous ne mettons pas arbitrairement toutes les mutations en file afin d'éviter
  // les doubles ventes, paiements ou suppressions lors d'une reconnexion.
  if (isReceptionCreate(config) && typeof navigator !== 'undefined' && !navigator.onLine) {
    await queueReceptionWhileOffline(config);
    config.adapter = async () => ({
      data: { queuedOffline: true },
      status: 202,
      statusText: 'Accepted',
      headers: {},
      config,
      request: null,
    });
  }

  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) { refreshSubscribers.push(cb); }
function onRefreshed(token) { refreshSubscribers.forEach((cb) => cb(token)); refreshSubscribers = []; }

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 402) window.dispatchEvent(new CustomEvent('saas-paywall-locked'));

    if (status === 401 && originalRequest && !originalRequest._retry) {
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
            if (!token) return reject(error);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const token = data.access_token || data.accessToken;
        if (!token) throw new Error('Refresh token response did not contain an access token');
        localStorage.setItem('depot_token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        onRefreshed(token);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem('depot_token');
        localStorage.removeItem('depot_user');
        onRefreshed(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const normalized = normalizeApiError(error);
    error.apiError = normalized;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gestock:api-error', { detail: normalized }));
    }
    return Promise.reject(error);
  },
);

registerQuotaForbiddenInterceptor(api);

export function buildUrl(metier, resource) {
  const base = api.defaults.baseURL.replace(/\/api\/v1$/, '').replace(/\/api\/v1\/$/, '');
  const metierSlug = metier.toLowerCase().replace(/_/g, '-');
  const path = resource.startsWith('/') ? resource : `/${resource}`;
  return `${base}/api/${metierSlug}${path}`;
}

export default api;
