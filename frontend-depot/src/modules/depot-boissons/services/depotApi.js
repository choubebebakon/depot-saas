import api from '../../../api/axios';

function getTenantHeaders(depotIdOverride = null) {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = depotIdOverride || localStorage.getItem('depot_actif_id');
  return { headers: { 'X-Tenant-Id': tenantId || '', 'X-Depot-Id': depotId || '' } };
}
function cleanParams(params) {
  if (!params || typeof params !== 'object') return params;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}
function requireDepotId(depotId) {
  if (!depotId) throw new Error('Dépôt actif requis');
  return depotId;
}
export const depotApi = {
  getDashboardStats: () => { const depotId = localStorage.getItem('depot_actif_id'); return api.get('/depot-boissons/dashboard', { ...getTenantHeaders(depotId), params: depotId ? { depotId } : {} }); },
  getArticles: (params = {}) => { const depotId = params.depotId || null; return api.get('/depot-boissons/articles', { ...getTenantHeaders(depotId), params: cleanParams(params) }); },
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
  getConsignesClient: (clientId, depotIdOverride = null) => api.get(`/depot-boissons/consignes/${clientId}`, getTenantHeaders(requireDepotId(depotIdOverride))),
  sortirConsigne: (data) => api.post('/depot-boissons/consignes/sortie', data, getTenantHeaders(data?.depotId)),
  retourConsigne: (data) => api.post('/depot-boissons/consignes/retour', data, getTenantHeaders(data?.depotId)),
  rembourserConsigne: (data) => api.post('/depot-boissons/consignes/remboursement', data, getTenantHeaders(data?.depotId)),
  historiqueConsignes: (clientId, depotIdOverride = null) => api.get(`/depot-boissons/consignes/${clientId}/historique`, getTenantHeaders(requireDepotId(depotIdOverride))),
  getLivraisons: () => api.get('/fournisseurs/receptions', getTenantHeaders()),
  getLivraison: (id) => api.get('/fournisseurs/receptions', getTenantHeaders()).then((res) => {
    const rows = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return { ...res, data: rows.find((row) => row.id === id) || null };
  }),
  createLivraison: () => Promise.reject(new Error('Utiliser le module Achats/Réceptions pour créer une livraison.')),
  updateLivraison: () => Promise.reject(new Error('Les réceptions sont immuables après création.')),
  deleteLivraison: () => Promise.reject(new Error('Une réception ne peut pas être supprimée depuis le suivi des livraisons.')),
  getDepots: () => api.get('/depot-boissons/depots', getTenantHeaders()),
  getTricycles: (depotId) => { const activeDepotId = requireDepotId(depotId); return api.get('/tournees/tricycles', { ...getTenantHeaders(activeDepotId), params: { depotId: activeDepotId } }); },
  createTricycle: (data) => { const activeDepotId = requireDepotId(data?.depotId); return api.post('/tournees/tricycles', { ...data, depotId: activeDepotId }, getTenantHeaders(activeDepotId)); },
  updateTricycle: (id, data) => { const activeDepotId = requireDepotId(data?.depotId); return api.patch(`/tournees/tricycles/${id}`, { ...data, depotId: activeDepotId }, getTenantHeaders(activeDepotId)); },
  getCommerciaux: (depotId) => { const activeDepotId = requireDepotId(depotId); return api.get('/users/commerciaux', { ...getTenantHeaders(activeDepotId), params: { depotId: activeDepotId } }); },
  getTournees: (params = {}) => { const activeDepotId = requireDepotId(params.depotId); return api.get('/depot-boissons/tournees', { ...getTenantHeaders(activeDepotId), params: cleanParams({ ...params, depotId: activeDepotId }) }); },
  getTournee: (id, depotId) => api.get(`/depot-boissons/tournees/${id}`, getTenantHeaders(requireDepotId(depotId))),
  createTournee: (data) => { const activeDepotId = requireDepotId(data?.depotId); return api.post('/depot-boissons/tournees', { ...data, depotId: activeDepotId }, getTenantHeaders(activeDepotId)); },
  updateTournee: (id, data) => { const activeDepotId = requireDepotId(data?.depotId); return api.patch(`/depot-boissons/tournees/${id}`, { ...data, depotId: activeDepotId }, getTenantHeaders(activeDepotId)); },
  demarrerTournee: (id, depotId) => api.post(`/depot-boissons/tournees/${id}/demarrer`, {}, getTenantHeaders(requireDepotId(depotId))),
  cloturerTournee: (id, data) => { const activeDepotId = requireDepotId(data?.depotId); return api.post(`/depot-boissons/tournees/${id}/cloturer`, data, getTenantHeaders(activeDepotId)); },
  chargerArticlesTournee: (id, data) => { const activeDepotId = requireDepotId(data?.depotId); return api.post(`/depot-boissons/tournees/${id}/charger`, data, getTenantHeaders(activeDepotId)); },
  getRecapTournee: (id, depotId) => api.get(`/depot-boissons/tournees/${id}/recap`, getTenantHeaders(requireDepotId(depotId))),
  getClients: (params) => api.get('/depot-boissons/clients', { ...getTenantHeaders(params?.depotId), params: cleanParams(params) }),
  getClient: (id) => api.get(`/depot-boissons/clients/${id}`, getTenantHeaders()),
  createClient: (data) => api.post('/depot-boissons/clients', data, getTenantHeaders(data?.depotId)),
  updateClient: (id, data) => api.patch(`/depot-boissons/clients/${id}`, data, getTenantHeaders(data?.depotId)),
  payerDette: (id, data) => api.post(`/depot-boissons/clients/${id}/payer-dette`, data, getTenantHeaders(data?.depotId)),
  historiqueAchats: (id, params) => api.get(`/depot-boissons/clients/${id}/historique-achats`, { ...getTenantHeaders(params?.depotId), params: cleanParams(params) }),
  getFournisseurs: (params = {}, depotIdOverride = null) => api.get('/depot-boissons/fournisseurs', { ...getTenantHeaders(depotIdOverride || params.depotId), params: cleanParams(params) }),
  getFournisseur: (id, depotIdOverride = null) => api.get(`/depot-boissons/fournisseurs/${id}`, getTenantHeaders(depotIdOverride)),
  createFournisseur: (data) => api.post('/depot-boissons/fournisseurs', data, getTenantHeaders(data?.depotId)),
  updateFournisseur: (id, data) => api.patch(`/depot-boissons/fournisseurs/${id}`, data, getTenantHeaders(data?.depotId)),
  passerCommandeFournisseur: (data) => api.post('/depot-boissons/fournisseurs/commander', data, getTenantHeaders(data?.depotId)),
  receptionnerLivraison: (id, data) => api.post(`/depot-boissons/fournisseurs/${id}/receptionner`, data, getTenantHeaders(data?.depotId)),
  reglerDetteFournisseur: (id, data) => api.post(`/depot-boissons/fournisseurs/${id}/regler`, data, getTenantHeaders(data?.depotId)),
  historiqueCommandes: (id, depotIdOverride = null) => api.get(`/depot-boissons/fournisseurs/${id}/commandes`, getTenantHeaders(depotIdOverride)),
  getVentes: (params) => api.get('/depot-boissons/ventes', { ...getTenantHeaders(params?.depotId), params: cleanParams(params) }),
  getVente: (id) => api.get(`/depot-boissons/ventes/${id}`, getTenantHeaders()),
  createVente: (data) => api.post('/depot-boissons/ventes', data, getTenantHeaders(data?.depotId)),
  annulerVente: (id) => api.post(`/depot-boissons/ventes/${id}/annuler`, {}, getTenantHeaders()),
  imprimerTicket: (id) => api.get(`/depot-boissons/ventes/${id}/ticket`, { ...getTenantHeaders(), responseType: 'blob' }),
  getCaisseStatut: (depotId) => api.get('/depot-boissons/caisse/statut', getTenantHeaders(depotId)),
  ouvrirCaisse: (data) => api.post('/depot-boissons/caisse/ouvrir', data, getTenantHeaders(data?.depotId)),
  fermerCaisse: (data = {}) => api.post('/depot-boissons/caisse/fermer', data, getTenantHeaders(data?.depotId)),
  mouvementCaisse: (data) => api.post('/depot-boissons/caisse/mouvement', data, getTenantHeaders(data?.depotId)),
  rapportJournalier: (depotId) => api.get('/depot-boissons/caisse/rapport-journalier', getTenantHeaders(depotId)),
  getDepenses: (params) => api.get('/depot-boissons/depenses', { ...getTenantHeaders(params?.depotId), params: cleanParams(params) }),
  createDepense: (data) => api.post('/depot-boissons/depenses', data, getTenantHeaders(data?.depotId)),
  deleteDepense: (id) => api.delete(`/depot-boissons/depenses/${id}`, getTenantHeaders()),
  getRapport: (type, params) => api.get(`/depot-boissons/rapports/${type}`, { ...getTenantHeaders(params?.depotId), params: cleanParams(params) }),
  exporterRapport: (type, format, params) => api.get(`/depot-boissons/rapports/${type}/export.${format}`, { ...getTenantHeaders(params?.depotId), params: cleanParams(params), responseType: 'blob' }),
};
