import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('depot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const depotId = getActiveDepotId();
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      console.error('[Paywall] Abonnement expire detecte.');
      window.dispatchEvent(new CustomEvent('saas-paywall-locked'));
    }
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('depot_token');
        localStorage.removeItem('depot_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
