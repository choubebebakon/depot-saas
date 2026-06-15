import api from '../../../api/axios';

function getTenantHeaders() {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = localStorage.getItem('depot_actif_id');
  return {
    headers: {
      'X-Tenant-Id': tenantId || '',
      'X-Depot-Id': depotId || '',
    },
  };
}

export const supermarcheApi = {
  // Stats / Dashboard
  getStats: () =>
    api.get('/supermarche/stats', getTenantHeaders()),

  // Articles / Produits
  getArticles: (params) =>
    api.get('/supermarche/articles', { ...getTenantHeaders(), params }),
  getProduits: (params) =>
    api.get('/supermarche/produits', { ...getTenantHeaders(), params }),
  getArticle: (id) =>
    api.get(`/supermarche/articles/${id}`, getTenantHeaders()),
  createArticle: (data) =>
    api.post('/supermarche/articles', data, getTenantHeaders()),
  updateArticle: (id, data) =>
    api.patch(`/supermarche/articles/${id}`, data, getTenantHeaders()),
  deleteProduit: (id) =>
    api.delete(`/supermarche/produits/${id}`, getTenantHeaders()),

  // Rayons
  getRayons: (params) =>
    api.get('/supermarche/rayons', { ...getTenantHeaders(), params }),
  createRayon: (data) =>
    api.post('/supermarche/rayons', data, getTenantHeaders()),
  updateRayon: (id, data) =>
    api.patch(`/supermarche/rayons/${id}`, data, getTenantHeaders()),
  deleteRayon: (id) =>
    api.delete(`/supermarche/rayons/${id}`, getTenantHeaders()),
  assignArticleToRayon: (rayonId, articleId) =>
    api.post(`/supermarche/rayons/${rayonId}/articles`, { articleId }, getTenantHeaders()),

  // Stock
  getStock: (params) =>
    api.get('/supermarche/stock', { ...getTenantHeaders(), params }),

  // Codes-barres
  scanCodeBarres: (code) =>
    api.get(`/supermarche/codes-barres/scan/${code}`, getTenantHeaders()),
};
