import api from '../../../api/axios';

function getTenantHeaders() {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = localStorage.getItem('gestock_depotId');
  return {
    headers: {
      'X-Tenant-Id': tenantId || '',
      'X-Depot-Id': depotId || '',
    },
  };
}

export const depotApi = {
  // Dashboard
  getDashboardStats: () =>
    api.get('/depot-boissons/dashboard', getTenantHeaders()),

  // Articles / Stock
  getArticles: (params) =>
    api.get('/depot-boissons/articles', { ...getTenantHeaders(), params }),
  getArticle: (id) =>
    api.get(`/depot-boissons/articles/${id}`, getTenantHeaders()),
  createArticle: (data) =>
    api.post('/depot-boissons/articles', data, getTenantHeaders()),
  updateArticle: (id, data) =>
    api.patch(`/depot-boissons/articles/${id}`, data, getTenantHeaders()),
  archiveArticle: (id) =>
    api.delete(`/depot-boissons/articles/${id}`, getTenantHeaders()),
  getStockHistory: (id) =>
    api.get(`/depot-boissons/articles/${id}/historique`, getTenantHeaders()),

  // Entrées / Sorties stock
  entreStock: (data) =>
    api.post('/depot-boissons/stock/entree', data, getTenantHeaders()),
  sortieStock: (data) =>
    api.post('/depot-boissons/stock/sortie', data, getTenantHeaders()),
  transfertStock: (data) =>
    api.post('/depot-boissons/stock/transfert', data, getTenantHeaders()),

  // Conditionnements
  getConditionnements: () =>
    api.get('/depot-boissons/conditionnements', getTenantHeaders()),
  createConditionnement: (data) =>
    api.post('/depot-boissons/conditionnements', data, getTenantHeaders()),
  updateConditionnement: (id, data) =>
    api.patch(`/depot-boissons/conditionnements/${id}`, data, getTenantHeaders()),
  deleteConditionnement: (id) =>
    api.delete(`/depot-boissons/conditionnements/${id}`, getTenantHeaders()),

  // Consignes
  getConsignesClient: (clientId) =>
    api.get(`/depot-boissons/consignes/${clientId}`, getTenantHeaders()),
  sortirConsigne: (data) =>
    api.post('/depot-boissons/consignes/sortie', data, getTenantHeaders()),
  retourConsigne: (data) =>
    api.post('/depot-boissons/consignes/retour', data, getTenantHeaders()),
  rembourserConsigne: (data) =>
    api.post('/depot-boissons/consignes/remboursement', data, getTenantHeaders()),
  historiqueConsignes: (clientId) =>
    api.get(`/depot-boissons/consignes/${clientId}/historique`, getTenantHeaders()),

  // Livraisons
  getLivraisons: (params) =>
    api.get('/depot-boissons/livraisons', { ...getTenantHeaders(), params }),
  getLivraison: (id) =>
    api.get(`/depot-boissons/livraisons/${id}`, getTenantHeaders()),
  createLivraison: (data) =>
    api.post('/depot-boissons/livraisons', data, getTenantHeaders()),
  updateLivraison: (id, data) =>
    api.patch(`/depot-boissons/livraisons/${id}`, data, getTenantHeaders()),
  deleteLivraison: (id) =>
    api.delete(`/depot-boissons/livraisons/${id}`, getTenantHeaders()),

  // Tournées
  getTournees: (params) =>
    api.get('/depot-boissons/tournees', { ...getTenantHeaders(), params }),
  getTournee: (id) =>
    api.get(`/depot-boissons/tournees/${id}`, getTenantHeaders()),
  createTournee: (data) =>
    api.post('/depot-boissons/tournees', data, getTenantHeaders()),
  demarrerTournee: (id) =>
    api.post(`/depot-boissons/tournees/${id}/demarrer`, {}, getTenantHeaders()),
  cloturerTournee: (id, data) =>
    api.post(`/depot-boissons/tournees/${id}/cloturer`, data, getTenantHeaders()),
  chargerArticlesTournee: (id, data) =>
    api.post(`/depot-boissons/tournees/${id}/charger`, data, getTenantHeaders()),
  getRecapTournee: (id) =>
    api.get(`/depot-boissons/tournees/${id}/recap`, getTenantHeaders()),

  // Clients
  getClients: (params) =>
    api.get('/depot-boissons/clients', { ...getTenantHeaders(), params }),
  getClient: (id) =>
    api.get(`/depot-boissons/clients/${id}`, getTenantHeaders()),
  createClient: (data) =>
    api.post('/depot-boissons/clients', data, getTenantHeaders()),
  updateClient: (id, data) =>
    api.patch(`/depot-boissons/clients/${id}`, data, getTenantHeaders()),
  payerDette: (id, data) =>
    api.post(`/depot-boissons/clients/${id}/payer-dette`, data, getTenantHeaders()),
  historiqueAchats: (id, params) =>
    api.get(`/depot-boissons/clients/${id}/historique-achats`, { ...getTenantHeaders(), params }),

  // Fournisseurs
  getFournisseurs: (params) =>
    api.get('/depot-boissons/fournisseurs', { ...getTenantHeaders(), params }),
  getFournisseur: (id) =>
    api.get(`/depot-boissons/fournisseurs/${id}`, getTenantHeaders()),
  createFournisseur: (data) =>
    api.post('/depot-boissons/fournisseurs', data, getTenantHeaders()),
  updateFournisseur: (id, data) =>
    api.patch(`/depot-boissons/fournisseurs/${id}`, data, getTenantHeaders()),
  passerCommandeFournisseur: (data) =>
    api.post('/depot-boissons/fournisseurs/commander', data, getTenantHeaders()),
  receptionnerLivraison: (id, data) =>
    api.post(`/depot-boissons/fournisseurs/${id}/receptionner`, data, getTenantHeaders()),
  reglerDetteFournisseur: (id, data) =>
    api.post(`/depot-boissons/fournisseurs/${id}/regler`, data, getTenantHeaders()),
  historiqueCommandes: (id) =>
    api.get(`/depot-boissons/fournisseurs/${id}/commandes`, getTenantHeaders()),

  // Ventes
  getVentes: (params) =>
    api.get('/depot-boissons/ventes', { ...getTenantHeaders(), params }),
  getVente: (id) =>
    api.get(`/depot-boissons/ventes/${id}`, getTenantHeaders()),
  createVente: (data) =>
    api.post('/depot-boissons/ventes', data, getTenantHeaders()),
  annulerVente: (id) =>
    api.post(`/depot-boissons/ventes/${id}/annuler`, {}, getTenantHeaders()),
  imprimerTicket: (id) =>
    api.get(`/depot-boissons/ventes/${id}/ticket`, { ...getTenantHeaders(), responseType: 'blob' }),

  // Caisse
  getCaisseStatut: () =>
    api.get('/depot-boissons/caisse/statut', getTenantHeaders()),
  ouvrirCaisse: (data) =>
    api.post('/depot-boissons/caisse/ouvrir', data, getTenantHeaders()),
  fermerCaisse: (data) =>
    api.post('/depot-boissons/caisse/fermer', data, getTenantHeaders()),
  mouvementCaisse: (data) =>
    api.post('/depot-boissons/caisse/mouvement', data, getTenantHeaders()),
  rapportJournalier: () =>
    api.get('/depot-boissons/caisse/rapport-journalier', getTenantHeaders()),

  // Dépenses
  getDepenses: (params) =>
    api.get('/depot-boissons/depenses', { ...getTenantHeaders(), params }),
  createDepense: (data) =>
    api.post('/depot-boissons/depenses', data, getTenantHeaders()),
  deleteDepense: (id) =>
    api.delete(`/depot-boissons/depenses/${id}`, getTenantHeaders()),

  // Rapports
  getRapport: (type, params) =>
    api.get(`/depot-boissons/rapports/${type}`, { ...getTenantHeaders(), params }),
  exporterRapport: (type, format, params) =>
    api.get(`/depot-boissons/rapports/${type}/export.${format}`, {
      ...getTenantHeaders(),
      params,
      responseType: 'blob',
    }),
};
