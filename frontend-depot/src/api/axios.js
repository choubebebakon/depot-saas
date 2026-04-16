import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// INTERCEPTEUR REQUEST : injecte le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('depot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTEUR RESPONSE : gère le Paywall (402) et l'expiration JWT (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      console.error('🔥 [Paywall] Abonnement expiré détecté.');
      window.dispatchEvent(new CustomEvent('saas-paywall-locked'));
    }
    if (error.response?.status === 401) {
      // Token expiré → déconnexion automatique
      localStorage.removeItem('depot_token');
      localStorage.removeItem('depot_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
