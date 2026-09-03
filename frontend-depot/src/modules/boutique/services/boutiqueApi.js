import api from '../../../api/axios';

function getTenantHeaders() {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = localStorage.getItem('depot_actif_id');
  const headers = {};
  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (depotId && depotId !== 'all') headers['X-Depot-Id'] = depotId;
  return { headers };
}

function cleanParams(params) {
  if (!params || typeof params !== 'object') return params;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  );
}

export const boutiqueApi = {
  getStats: () => api.get('/boutique/stats', getTenantHeaders()),

  getArticles: (params) =>
    api.get('/boutique/articles', { ...getTenantHeaders(), params: cleanParams(params) }),
  getArticle: (id) => api.get(`/boutique/articles/${id}`, getTenantHeaders()),
  createArticle: (data) => api.post('/boutique/articles', data, getTenantHeaders()),
  updateArticle: (id, data) => api.patch(`/boutique/articles/${id}`, data, getTenantHeaders()),
  deleteArticle: (id) => api.delete(`/boutique/articles/${id}`, getTenantHeaders()),

  getStock: (params) =>
    api.get('/boutique/stock', { ...getTenantHeaders(), params: cleanParams(params) }),

  getClients: (params) =>
    api.get('/boutique/clients', { ...getTenantHeaders(), params: cleanParams(params) }),
  getClient: (id) => api.get(`/boutique/clients/${id}`, getTenantHeaders()),
  createClient: (data) => api.post('/boutique/clients', data, getTenantHeaders()),
  updateClient: (id, data) => api.patch(`/boutique/clients/${id}`, data, getTenantHeaders()),
  deleteClient: (id) => api.delete(`/boutique/clients/${id}`, getTenantHeaders()),

  getFournisseurs: (params) =>
    api.get('/boutique/fournisseurs', { ...getTenantHeaders(), params: cleanParams(params) }),
  getFournisseur: (id) => api.get(`/boutique/fournisseurs/${id}`, getTenantHeaders()),
  createFournisseur: (data) => api.post('/boutique/fournisseurs', data, getTenantHeaders()),
  updateFournisseur: (id, data) => api.patch(`/boutique/fournisseurs/${id}`, data, getTenantHeaders()),
  deleteFournisseur: (id) => api.delete(`/boutique/fournisseurs/${id}`, getTenantHeaders()),

  getDepenses: (params) =>
    api.get('/boutique/depenses-production', { ...getTenantHeaders(), params: cleanParams(params) }),
  getDepense: (id) => api.get(`/boutique/depenses-production/${id}`, getTenantHeaders()),
  createDepense: (data) => api.post('/boutique/depenses-production', data, getTenantHeaders()),
  updateDepense: (id, data) => api.patch(`/boutique/depenses-production/${id}`, data, getTenantHeaders()),
  deleteDepense: (id) => api.delete(`/boutique/depenses-production/${id}`, getTenantHeaders()),

  getFactures: (params) =>
    api.get('/boutique/factures', { ...getTenantHeaders(), params: cleanParams(params) }),
  getFacture: (id) => api.get(`/boutique/factures/${id}`, getTenantHeaders()),
  createFacture: (data) => api.post('/boutique/factures', data, getTenantHeaders()),
  updateFacture: (id, data) => api.patch(`/boutique/factures/${id}`, data, getTenantHeaders()),
  deleteFacture: (id) => api.delete(`/boutique/factures/${id}`, getTenantHeaders()),

  getPromotions: (params) =>
    api.get('/boutique/promotions', { ...getTenantHeaders(), params: cleanParams(params) }),
  createPromotion: (data) => api.post('/boutique/promotions', data, getTenantHeaders()),
  updatePromotion: (id, data) => api.patch(`/boutique/promotions/${id}`, data, getTenantHeaders()),
  deletePromotion: (id) => api.delete(`/boutique/promotions/${id}`, getTenantHeaders()),

  getRapports: (params) =>
    api.get('/boutique/rapports', { ...getTenantHeaders(), params: cleanParams(params) }),
  exportRapport: (format, params) =>
    api.get('/boutique/rapports/export', {
      ...getTenantHeaders(),
      params: cleanParams({ ...params, format }),
      responseType: 'blob',
    }),

  getParametres: () => api.get('/boutique/parametres', getTenantHeaders()),
  updateParametres: (data) => api.put('/boutique/parametres', data, getTenantHeaders()),

  getCategories: () => api.get('/boutique/categories', getTenantHeaders()),
  getCategorie: (id) => api.get(`/boutique/categories/${id}`, getTenantHeaders()),
  createCategorie: (data) => api.post('/boutique/categories', data, getTenantHeaders()),
  updateCategorie: (id, data) => api.put(`/boutique/categories/${id}`, data, getTenantHeaders()),
  deleteCategorie: (id) => api.delete(`/boutique/categories/${id}`, getTenantHeaders()),
  seedCategories: (type) => api.post(`/boutique/categories/seed/${type}`, {}, getTenantHeaders()),

  createVente: (data) => api.post('/boutique/ventes', data, getTenantHeaders()),
  getVentes: (params) =>
    api.get('/boutique/ventes', { ...getTenantHeaders(), params: cleanParams(params) }),
  getVente: (id) => api.get(`/boutique/ventes/${id}`, getTenantHeaders()),
  annulerVente: (id, motif) =>
    api.patch(`/boutique/ventes/${id}/annuler`, { motif }, getTenantHeaders()),
};