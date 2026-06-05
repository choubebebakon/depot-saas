export const DASHBOARD_WIDGETS = [
  { id: 'produits_total',   label: 'Produits total',   icon: '🧴', color: '#d946ef', apiPath: '/parfumerie/stats/produits-total' },
  { id: 'stock_alerte',     label: 'Stock alerte',     icon: '⚠️', color: '#ef4444', apiPath: '/parfumerie/stats/stock-alerte' },
  { id: 'ca_jour',          label: 'CA du jour',       icon: '💰', color: '#10b981', apiPath: '/parfumerie/stats/ca-jour' },
  { id: 'points_distribues',label: 'Points fidélité',  icon: '🎁', color: '#f59e0b', apiPath: '/parfumerie/stats/points-distribues' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',   label: 'Ventes (mois)',   type: 'bar',  apiPath: '/parfumerie/stats/ventes-mois' },
  { id: 'ca_mensuel',    label: 'CA mensuel',      type: 'line', apiPath: '/parfumerie/stats/ca-mensuel' },
  { id: 'categories_rep', label: 'Répartition cat.', type: 'pie', apiPath: '/parfumerie/stats/categories-repartition' },
];
