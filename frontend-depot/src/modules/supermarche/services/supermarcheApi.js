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
  getDepots: () => api.get('/supermarche/depots', getTenantHeaders()),

  // ── Mouvements de stock (temps réel) ─────────────────────────────────────
  entreeStock: (data) => api.post('/supermarche/stock/entree', data, getTenantHeaders()),
  sortieStock: (data) => api.post('/supermarche/stock/sortie', data, getTenantHeaders()),
  transfertStock: (data) => api.post('/supermarche/stock/transfert', data, getTenantHeaders()),
  getStockHistorique: (params) => api.get('/supermarche/stock/historique', { ...getTenantHeaders(), params: cleanParams(params) }),

  // ── Ventes / Factures ────────────────────────────────────────────────────
  getClients: (params) => api.get('/supermarche/clients', { ...getTenantHeaders(), params: cleanParams(params) }),
  getVentes: (params) => api.get('/supermarche/ventes', { ...getTenantHeaders(), params: cleanParams(params) }),
  getVente: (id) => api.get(`/supermarche/ventes/${id}`, getTenantHeaders()),
  annulerVente: (id, data) => api.patch(`/supermarche/ventes/${id}/annuler`, data, getTenantHeaders()),

  // ── Paramètres ───────────────────────────────────────────────────────────
  getParametres: () => api.get('/supermarche/parametres', getTenantHeaders()),

  createVente: (data) => api.post('/supermarche/ventes', data, getTenantHeaders()),
  getPromotions: () => api.get('/supermarche/promotions', getTenantHeaders()),
  createPromotion: (data) => api.post('/supermarche/promotions', data, getTenantHeaders()),
  updatePromotion: (id, data) => api.patch(`/supermarche/promotions/${id}`, data, getTenantHeaders()),
  deletePromotion: (id) => api.delete(`/supermarche/promotions/${id}`, getTenantHeaders()),
  scanCodeBarres: (code) => api.get(`/supermarche/codes-barres/scan/${encodeURIComponent(code)}`, getTenantHeaders()),

  // POS/Caisse multi-poste : le poste actif (CAISSE_1, CAISSE_2…) est transmis
  // à chaque appel pour cibler la session de caisse correspondante.
  getSessionCaisseActive: (tenantId, depotId, posteId) => api.get('/caisse/session-active', {
    params: cleanParams({ tenantId, depotId, posteId }),
    ...getScopedHeaders(tenantId, depotId),
  }),
  ouvrirCaisse: (data) => api.post('/caisse/ouvrir', data, getScopedHeaders(data?.tenantId, data?.depotId)),
  fermerCaisse: (data) => api.post('/caisse/fermer', data, getScopedHeaders(data?.tenantId, data?.depotId)),
  getSessionsOuvertes: (tenantId, depotId) => api.get('/caisse/sessions-ouvertes', {
    params: cleanParams({ tenantId, depotId }),
    ...getScopedHeaders(tenantId, depotId),
  }),
  getResumeCaisse: (tenantId, depotId, posteId) => api.get('/caisse/resume', {
    params: cleanParams({ tenantId, depotId, posteId }),
    ...getScopedHeaders(tenantId, depotId),
  }),
};
