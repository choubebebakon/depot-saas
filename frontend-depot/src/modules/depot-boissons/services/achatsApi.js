import api from '../../../api/axios';

const scopeConfig = () => ({
  headers: {
    'X-Tenant-Id': localStorage.getItem('gestock_tenantId') || '',
    'X-Depot-Id': localStorage.getItem('depot_actif_id') || '',
  },
});

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

export const achatsApi = {
  getFournisseurs: async () => unwrap(await api.get('/fournisseurs', scopeConfig())),
  getArticles: async () => unwrap(await api.get('/depot-boissons/articles', scopeConfig())),
  getCommandes: async () => unwrap(await api.get('/commandes', scopeConfig())),
  getCommande: async (id) => unwrap(await api.get(`/commandes/${id}`, scopeConfig())),
  getSuggestions: async () => unwrap(await api.get('/commandes/suggestions', scopeConfig())),
  createCommande: async (payload) => unwrap(await api.post('/commandes', payload, scopeConfig())),
  updateCommande: async (id, payload) => unwrap(await api.put(`/commandes/${id}`, payload, scopeConfig())),
  updateCommandeStatut: async (id, statut) => unwrap(await api.patch(`/commandes/${id}/statut`, { statut }, scopeConfig())),
  getReceptions: async () => unwrap(await api.get('/fournisseurs/receptions', scopeConfig())),
  createReception: async (payload, idempotencyKey) => unwrap(await api.post(
    '/fournisseurs/receptions',
    payload,
    {
      ...scopeConfig(),
      headers: {
        ...scopeConfig().headers,
        'X-Idempotency-Key': idempotencyKey,
      },
    },
  )),
};
