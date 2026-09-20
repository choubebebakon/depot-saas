import api from '../../../api/axios';

function headers() {
  const tenantId = localStorage.getItem('gestock_tenantId');
  const depotId = localStorage.getItem('depot_actif_id');
  return { headers: { 'X-Tenant-Id': tenantId || '', 'X-Depot-Id': depotId || '' } };
}

export const tourneeWorkflowApi = {
  list: () => api.get('/depot-boissons/tournee-workflow', headers()),
  get: (id) => api.get(`/depot-boissons/tournee-workflow/${id}`, headers()),
  create: (data) => api.post('/depot-boissons/tournee-workflow', data, headers()),
  update: (id, data) => api.patch(`/depot-boissons/tournee-workflow/${id}`, data, headers()),
  addLine: (id, data) => api.post(`/depot-boissons/tournee-workflow/${id}/lignes`, data, headers()),
  removeLine: (id, lineId) => api.delete(`/depot-boissons/tournee-workflow/${id}/lignes/${lineId}`, headers()),
  depart: (id) => api.post(`/depot-boissons/tournee-workflow/${id}/depart`, {}, headers()),
  reconcile: (id, data) => api.post(`/depot-boissons/tournee-workflow/${id}/reconciliation`, data, headers()),
  close: (id) => api.post(`/depot-boissons/tournee-workflow/${id}/cloture`, {}, headers()),
  stock: (articleId) => api.get(`/depot-boissons/tournee-workflow/stock/${articleId}`, headers()),
  tricycles: () => api.get('/depot-boissons/tournee-workflow-options/tricycles', headers()),
  commerciaux: () => api.get('/depot-boissons/tournee-workflow-options/commerciaux', headers()),
  articles: () => api.get('/depot-boissons/tournee-workflow-options/articles', headers()),
  bonSortie: (id) => api.get(`/depot-boissons/tournee-workflow/${id}/bon-sortie`, { ...headers(), responseType: 'blob' }),
};
