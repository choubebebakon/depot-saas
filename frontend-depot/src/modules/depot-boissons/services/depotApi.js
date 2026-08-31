import api from '../../../api/axios';

function getTenantHeaders(depotIdOverride = null) {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = depotIdOverride || localStorage.getItem('depot_actif_id');
  return {
    headers: {
      'X-Tenant-Id': tenantId || '',
      'X-Depot-Id': depotId || '',
    },
  };
}

function cleanParams(params) {
  if (!params || typeof params !== 'object') return params;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

export const depotApi = {
  getDashboardStats: () => {
    const depotId = localStorage.getItem('depot_actif_id');
    const params = depotId ? { depotId } : {};
    return api.get('/depot-boissons/dashboard', { ...getTenantHeaders(depotId), params });
  },

  getArticles: (params) => api.get('/depot-boissons/articles', { ...getTenantHeaders(), params: cleanParams(params) }),
  getArticle: (id) => api.get(`/depot-boissons/articles/${id}`, getTenantHeaders()),
  createArticle: (data) => api.post('/depot-boissons/articles', data, getTenantHeaders(data?.depotId)),
  updateArticle: (id, data) => api.patch(`/depot-boissons/articles/${id}`, data, getTenantHeaders(data?.depotId)),
  archiveArticle: (id) => api.delete(`/depot-boissons/articles/${id}`, getTenantHeaders()),
  getStockHistory: (id) => api.get(`/depot-boissons/articles/${id}/historique`, getTenantHeaders()),
  entreStock: (data) => api.post('/depot-boissons/stock/entree', data, getTenantHeaders(data?.depotId)),
  sortieStock: (data) => api.post('/depot-boissons/stock/sortie', data, getTenantHeaders(data?.depotId)),
  transfertStock: (data) => api.post('/depot-boissons/stock/transfert', data, getTenantHeaders(data?.depotId)),

  getPromotions: () => api.get('/depot-boissons/promotions', getTenantHeaders()),
  createPromotion: (data) => api.post('/depot-boissons/promotions', data, getTenantHeaders(data?.depotId)),
  updatePromotion: (id, data) => api.patch(`/depot-boissons/promotions/${id}`, data, getTenantHeaders(data?.depotId)),
  deletePromotion: (id) => api.delete(`/depot-boissons/promotions/${id}`, getTenantHeaders()),

  getConditionnements: () => api.get('/depot-boissons/conditionnements', getTenantHeaders()),
  createConditionnement: (data) => api.post('/depot-boissons/conditionnements', data, getTenantHeaders(data?.depotId)),
  updateConditionnement: (id, data) => api.patch(`/depot-boissons/conditionnements/${id}`, data, getTenantHeaders(data?.depotId)),
  deleteConditionnement: (id) => api.delete(`/depot-boissons/conditionnements/${id}`, getTenantHeaders()),

  getConsignesClient: (clientId) => api.get(`/depot-boissons/consignes/${clientId}`, getTenantHeaders()),
  sortirConsigne: (data) => api.post('/depot-boissons/consignes/sortie', data, getTenantHeaders(data?.depotId)),
  retourConsigne: (data) => api.post('/depot-boissons/consignes/retour', data, getTenantHeaders(data?.depotId)),
  rembourserConsigne: (data) => api.post('/depot-boissons/consignes/remboursement', data, getTenantHeaders(data?.depotId)),
  historiqueConsignes: (clientId) => api.get(`/depot-boissons/consignes/${clientId}/historique`, getTenantHeaders()),

  getLivraisons: (params) => api.get('/depot-boissons/livraisons', { ...getTenantHeaders(), params: cleanParams(params) }),
  getLivraison: (id) => api.get(`/depot-boissons/livraisons/${id}`, getTenantHeaders()),
  createLivraison: (data) => api.post('/depot-boissons/livraisons', data, getTenantHeaders(data?.depotId)),
  updateLivraison: (id, data) => api.patch(`/depot-boissons/livraisons/${id}`, data, getTenantHeaders(data?.depotId)),
  deleteLivraison: (id) => api.delete(`/depot-boissons/livraisons/${id}`, getTenantHeaders()),
  getDepots: () => api.get('/depot-boissons/depots', getTenantHeaders()),

  getTournees: (params) => api.get('/depot-boissons/tournees', { ...getTenantHeaders(), params: cleanParams(params) }),
  getTournee: (id) => api.get(`/depot-boissons/tournees/${id}`, getTenantHeaders()),
  createTournee: (data) => api.post('/depot-boissons/tournees', data, getTenantHeaders(data?.depotId)),
  demarrerTournee: (id) => api.post(`/depot-boissons/tournees/${id}/demarrer`, {}, getTenantHeaders()),
  cloturerTournee: (id, data) => api.post(`/depot-boissons/tournees/${id}/cloturer`, data, getTenantHeaders(data?.depotId)),
  chargerArticlesTournee: (id, data) => api.post(`/depot-boissons/tournees/${id}/charger`, data, getTenantHeaders(data?.depotId)),
  getRecapTournee: (id) => api.get(`/depot-boissons/tournees/${id}/recap`, getTenantHeaders()),

  getClients: (params) => api.get('/depot-boissons/clients', { ...getTenantHeaders(), params: cleanParams(params) }),
  getClient: (id) => api.get(`/depot-boissons/clients/${id}`, getTenantHeaders()),
  createClient: (data) => api.post('/depot-boissons/clients', data, getTenantHeaders(data?.depotId)),
  updateClient: (id, data) => api.patch(`/depot-boissons/clients/${id}`, data, getTenantHeaders(data?.depotId)),
  payerDette: (id, data) => api.post(`/depot-boissons/clients/${id}/payer-dette`, data, getTenantHeaders(data?.depotId)),
  historiqueAchats: (id, params) => api.get(`/depot-boissons/clients/${id}/historique-achats`, { ...getTenantHeaders(), params: cleanParams(params) }),

  getFournisseurs: (params = {}, depotIdOverride = null) => api.get('/depot-boissons/fournisseurs', { ...getTenantHeaders(depotIdOverride), params: cleanParams(params) }),
  getFournisseur: (id, depotIdOverride = null) => api.get(`/depot-boissons/fournisseurs/${id}`, getTenantHeaders(depotIdOverride)),
  createFournisseur: (data) => api.post('/depot-boissons/fournisseurs', data, getTenantHeaders(data?.depotId)),
  updateFournisseur: (id, data) => api.patch(`/depot-boissons/fournisseurs/${id}`, data, getTenantHeaders(data?.depotId)),
  passerCommandeFournisseur: (data) => api.post('/depot-boissons/fournisseurs/commander', data, getTenantHeaders(data?.depotId)),
  receptionnerLivraison: (id, data) => api.post(`/depot-boissons/fournisseurs/${id}/receptionner`, data, getTenantHeaders(data?.depotId)),
  reglerDetteFournisseur: (id, data) => api.post(`/depot-boissons/fournisseurs/${id}/regler`, data, getTenantHeaders(data?.depotId)),
  historiqueCommandes: (id, depotIdOverride = null) => api.get(`/depot-boissons/fournisseurs/${id}/commandes`, getTenantHeaders(depotIdOverride)),

  getVentes: (params) => api.get('/depot-boissons/ventes', { ...getTenantHeaders(), params: cleanParams(params) }),
  getVente: (id) => api.get(`/depot-boissons/ventes/${id}`, getTenantHeaders()),
  createVente: (data) => api.post('/depot-boissons/ventes', data, getTenantHeaders(data?.depotId)),
  annulerVente: (id) => api.post(`/depot-boissons/ventes/${id}/annuler`, {}, getTenantHeaders()),
  imprimerTicket: (id) => api.get(`/depot-boissons/ventes/${id}/ticket`, { ...getTenantHeaders(), responseType: 'blob' }),

  getCaisseStatut: (depotId) => api.get('/depot-boissons/caisse/statut', getTenantHeaders(depotId)),
  ouvrirCaisse: (data) => api.post('/depot-boissons/caisse/ouvrir', data, getTenantHeaders(data?.depotId)),
  fermerCaisse: (data = {}) => api.post('/depot-boissons/caisse/fermer', data, getTenantHeaders(data?.depotId)),
  mouvementCaisse: (data) => api.post('/depot-boissons/caisse/mouvement', data, getTenantHeaders(data?.depotId)),
  rapportJournalier: (depotId) => api.get('/depot-boissons/caisse/rapport-journalier', getTenantHeaders(depotId)),

  getDepenses: (params) => api.get('/depot-boissons/depenses', { ...getTenantHeaders(), params: cleanParams(params) }),
  createDepense: (data) => api.post('/depot-boissons/depenses', data, getTenantHeaders(data?.depotId)),
  deleteDepense: (id) => api.delete(`/depot-boissons/depenses/${id}`, getTenantHeaders()),
  getRapport: (type, params) => api.get(`/depot-boissons/rapports/${type}`, { ...getTenantHeaders(), params: cleanParams(params) }),
  exporterRapport: (type, format, params) => api.get(`/depot-boissons/rapports/${type}/export.${format}`, { ...getTenantHeaders(), params: cleanParams(params), responseType: 'blob' }),
};
