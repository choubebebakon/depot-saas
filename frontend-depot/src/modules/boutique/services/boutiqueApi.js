import api from '../../../api/axios';

function getTenantHeaders() {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = localStorage.getItem('depot_actif_id');
  const headers = {};
  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (depotId && depotId !== 'all') headers['X-Depot-Id'] = depotId;
  return { headers };
}

/**
 * Supprime les clÃ©s dont la valeur est vide (""), null ou undefined
 * pour Ã©viter d'envoyer des params invalides Ã  l'API (ex: search="", categorieId="")
 */
function cleanParams(params) {
  if (!params || typeof params !== 'object') return params;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined
    )
  );
}

export const boutiqueApi = {
  // Stats / Dashboard
  getStats: () =>
    api.get('/boutique/stats', getTenantHeaders()),

  // Articles / Produits
  getArticles: (params) =>
    api.get('/boutique/articles', { ...getTenantHeaders(), params: cleanParams(params) }),
  getArticle: (id) =>
    api.get(`/boutique/articles/${id}`, getTenantHeaders()),
  createArticle: (data) =>
    api.post('/boutique/articles', data, getTenantHeaders()),
  updateArticle: (id, data) =>
    api.patch(`/boutique/articles/${id}`, data, getTenantHeaders()),
  deleteArticle: (id) =>
    api.delete(`/boutique/articles/${id}`, getTenantHeaders()),

  // Stock
  getStock: (params) =>
    api.get('/boutique/stock', { ...getTenantHeaders(), params: cleanParams(params) }),

  // Clients
  getClients: (params) =>
    api.get('/boutique/clients', { ...getTenantHeaders(), params: cleanParams(params) }),
  getClient: (id) =>
    api.get(`/boutique/clients/${id}`, getTenantHeaders()),
  createClient: (data) =>
    api.post('/boutique/clients', data, getTenantHeaders()),
  updateClient: (id, data) =>
    api.patch(`/boutique/clients/${id}`, data, getTenantHeaders()),
  deleteClient: (id) =>
    api.delete(`/boutique/clients/${id}`, getTenantHeaders()),

  // Fournisseurs
  getFournisseurs: (params) =>
    api.get('/boutique/fournisseurs', { ...getTenantHeaders(), params: cleanParams(params) }),
  getFournisseur: (id) =>
    api.get(`/boutique/fournisseurs/${id}`, getTenantHeaders()),
  createFournisseur: (data) =>
    api.post('/boutique/fournisseurs', data, getTenantHeaders()),
  updateFournisseur: (id, data) =>
    api.patch(`/boutique/fournisseurs/${id}`, data, getTenantHeaders()),
  deleteFournisseur: (id) =>
    api.delete(`/boutique/fournisseurs/${id}`, getTenantHeaders()),

  // DÃ©penses
  getDepenses: (params) =>
    api.get('/boutique/depenses', { ...getTenantHeaders(), params: cleanParams(params) }),
  getDepense: (id) =>
    api.get(`/boutique/depenses/${id}`, getTenantHeaders()),
  createDepense: (data) =>
    api.post('/boutique/depenses', data, getTenantHeaders()),
  updateDepense: (id, data) =>
    api.patch(`/boutique/depenses/${id}`, data, getTenantHeaders()),
  deleteDepense: (id) =>
    api.delete(`/boutique/depenses/${id}`, getTenantHeaders()),

  // Factures
  getFactures: (params) =>
    api.get('/boutique/factures', { ...getTenantHeaders(), params: cleanParams(params) }),
  getFacture: (id) =>
    api.get(`/boutique/factures/${id}`, getTenantHeaders()),
  createFacture: (data) =>
    api.post('/boutique/factures', data, getTenantHeaders()),
  updateFacture: (id, data) =>
    api.patch(`/boutique/factures/${id}`, data, getTenantHeaders()),
  deleteFacture: (id) =>
    api.delete(`/boutique/factures/${id}`, getTenantHeaders()),

  // Personnel
  getPersonnel: (params) =>
    api.get('/boutique/personnel', { ...getTenantHeaders(), params: cleanParams(params) }),
  getPersonnelMember: (id) =>
    api.get(`/boutique/personnel/${id}`, getTenantHeaders()),
  createPersonnelMember: (data) =>
    api.post('/boutique/personnel', data, getTenantHeaders()),
  updatePersonnelMember: (id, data) =>
    api.patch(`/boutique/personnel/${id}`, data, getTenantHeaders()),
  deletePersonnelMember: (id) =>
    api.delete(`/boutique/personnel/${id}`, getTenantHeaders()),

  // Promotions
  getPromotions: (params) =>
    api.get('/boutique/promotions', { ...getTenantHeaders(), params: cleanParams(params) }),
  createPromotion: (data) =>
    api.post('/boutique/promotions', data, getTenantHeaders()),
  updatePromotion: (id, data) =>
    api.patch(`/boutique/promotions/${id}`, data, getTenantHeaders()),
  deletePromotion: (id) =>
    api.delete(`/boutique/promotions/${id}`, getTenantHeaders()),

  // Rapports
  getRapports: (params) =>
    api.get('/boutique/rapports', { ...getTenantHeaders(), params: cleanParams(params) }),

  // ParamÃ¨tres
  getParametres: () =>
    api.get('/boutique/parametres', getTenantHeaders()),
  updateParametres: (data) =>
    api.put('/boutique/parametres', data, getTenantHeaders()),

  // CatÃ©gories
  getCategories: () =>
    api.get('/boutique/categories', getTenantHeaders()),
  getCategorie: (id) =>
    api.get(`/boutique/categories/${id}`, getTenantHeaders()),
  createCategorie: (data) =>
    api.post('/boutique/categories', data, getTenantHeaders()),
  updateCategorie: (id, data) =>
    api.put(`/boutique/categories/${id}`, data, getTenantHeaders()),
  deleteCategorie: (id) =>
    api.delete(`/boutique/categories/${id}`, getTenantHeaders()),
  seedCategories: (type) =>
    api.post(`/boutique/categories/seed/${type}`, {}, getTenantHeaders()),
};

