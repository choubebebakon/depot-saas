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

/**
 * Supprime les clés vides (""), null ou undefined avant envoi HTTP
 * pour éviter des filtres invalides côté Prisma (ex: search="", rayonId="")
 */
function cleanParams(params) {
  if (!params || typeof params !== 'object') return params;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

export const supermarcheApi = {
  // Stats / Dashboard
  getStats: () =>
    api.get('/supermarche/stats', getTenantHeaders()),

  // Articles / Produits
  getArticles: (params) =>
    api.get('/supermarche/articles', { ...getTenantHeaders(), params: cleanParams(params) }),
  getProduits: (params) =>
    api.get('/supermarche/produits', { ...getTenantHeaders(), params: cleanParams(params) }),
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
    api.get('/supermarche/rayons', { ...getTenantHeaders(), params: cleanParams(params) }),
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
    api.get('/supermarche/stock', { ...getTenantHeaders(), params: cleanParams(params) }),

  // Ventes
  createVente: (data) =>
    api.post('/supermarche/ventes', data, getTenantHeaders()),

  // Codes-barres
  scanCodeBarres: (code) =>
    api.get(`/supermarche/codes-barres/scan/${code}`, getTenantHeaders()),
};
