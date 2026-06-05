export const DASHBOARD_WIDGETS = [
  { id: 'produits_total',   label: 'Produits total',   icon: '🛠', color: '#b45309', apiPath: '/quincaillerie/stats/produits-total' },
  { id: 'stock_alerte',     label: 'Stock alerte',     icon: '⚠️', color: '#ef4444', apiPath: '/quincaillerie/stats/stock-alerte' },
  { id: 'ca_jour',          label: 'CA du jour',       icon: '💰', color: '#10b981', apiPath: '/quincaillerie/stats/ca-jour' },
  { id: 'chantiers_actifs', label: 'Chantiers actifs', icon: '🏗️', color: '#f59e0b', apiPath: '/quincaillerie/stats/chantiers-actifs' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',   label: 'Ventes (mois)',   type: 'bar',  apiPath: '/quincaillerie/stats/ventes-mois' },
  { id: 'ca_mensuel',    label: 'CA mensuel',       type: 'line', apiPath: '/quincaillerie/stats/ca-mensuel' },
  { id: 'categories_rep', label: 'Répartition cat.', type: 'pie', apiPath: '/quincaillerie/stats/categories-repartition' },
];
