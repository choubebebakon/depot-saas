import api from '../../../api/axios';

function getTenantHeaders() {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = localStorage.getItem('depot_actif_id');
  return { headers: { 'X-Tenant-Id': tenantId || '', 'X-Depot-Id': depotId || '' } };
}

function getScopedHeaders(tenantId, depotId) {
  return {
    headers: {
      'X-Tenant-Id': tenantId || '',
      'X-Depot-Id': depotId || '',
    },
  };
}

function cleanParams(params) {
  if (!params || typeof params !== 'object') return params;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

export const supermarcheApi = {
  getStats: () => api.get('/supermarche/stats', getTenantHeaders()),
  getArticles: (params) => api.get('/supermarche/articles', { ...getTenantHeaders(), params: cleanParams(params) }),
  getProduits: (params) => api.get('/supermarche/produits', { ...getTenantHeaders(), params: cleanParams(params) }),
  getArticle: (id) => api.get(`/supermarche/articles/${id}`, getTenantHeaders()),
  createArticle: (data) => api.post('/supermarche/articles', data, getTenantHeaders()),
  updateArticle: (id, data) => api.patch(`/supermarche/articles/${id}`, data, getTenantHeaders()),
  deleteProduit: (id) => api.delete(`/supermarche/produits/${id}`, getTenantHeaders()),
  getRayons: (params) => api.get('/supermarche/rayons', { ...getTenantHeaders(), params: cleanParams(params) }),
  createRayon: (data) => api.post('/supermarche/rayons', data, getTenantHeaders()),
  updateRayon: (id, data) => api.patch(`/supermarche/rayons/${id}`, data, getTenantHeaders()),
  deleteRayon: (id) => api.delete(`/supermarche/rayons/${id}`, getTenantHeaders()),
  assignArticleToRayon: (rayonId, articleId) => api.post(`/supermarche/rayons/${rayonId}/articles`, { articleId }, getTenantHeaders()),
  getStock: (params) => api.get('/supermarche/stock', { ...getTenantHeaders(), params: cleanParams(params) }),
  createVente: (data) => api.post('/supermarche/ventes', data, getTenantHeaders()),
  getPromotions: () => api.get('/supermarche/promotions', getTenantHeaders()),
  createPromotion: (data) => api.post('/supermarche/promotions', data, getTenantHeaders()),
  updatePromotion: (id, data) => api.patch(`/supermarche/promotions/${id}`, data, getTenantHeaders()),
  deletePromotion: (id) => api.delete(`/supermarche/promotions/${id}`, getTenantHeaders()),
  scanCodeBarres: (code) => api.get(`/supermarche/codes-barres/scan/${encodeURIComponent(code)}`, getTenantHeaders()),

  // POS/Caisse : le contexte actif fourni par la page est prioritaire.
  getSessionCaisseActive: (tenantId, depotId) => api.get('/caisse/session-active', {
    params: cleanParams({ tenantId, depotId }),
    ...getScopedHeaders(tenantId, depotId),
  }),
  ouvrirCaisse: (data) => api.post('/caisse/ouvrir', data, getScopedHeaders(data?.tenantId, data?.depotId)),
  fermerCaisse: (data) => api.post('/caisse/fermer', data, getScopedHeaders(data?.tenantId, data?.depotId)),
  getResumeCaisse: (tenantId, depotId) => api.get('/caisse/resume', {
    params: cleanParams({ tenantId, depotId }),
    ...getScopedHeaders(tenantId, depotId),
  }),
};
