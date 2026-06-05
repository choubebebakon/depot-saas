export const DASHBOARD_WIDGETS = [
  { id: 'ca_jour',            label: 'CA Jour',             icon: '💰', color: '#10b981', apiPath: '/supermarche/stats/ca-jour' },
  { id: 'transactions',       label: 'Transactions',        icon: '🧾', color: '#3b82f6', apiPath: '/supermarche/stats/transactions' },
  { id: 'ruptures_stock',     label: 'Ruptures stock',      icon: '⚠️',  color: '#ef4444', apiPath: '/supermarche/stats/ruptures' },
  { id: 'promotions_actives', label: 'Promotions actives',  icon: '🏷️', color: '#8b5cf6', apiPath: '/supermarche/stats/promotions' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'ventes_rayon',       label: 'Ventes par rayon',    type: 'pie',  apiPath: '/supermarche/stats/ventes-rayon' },
  { id: 'heures_pointe',      label: 'Heures de pointe',     type: 'bar',  apiPath: '/supermarche/stats/heures-pointe' },
  { id: 'top_produits',       label: 'Top produits',        type: 'line', apiPath: '/supermarche/stats/top-produits' },
];
