export const DASHBOARD_WIDGETS = [
  { id: 'ventes_jour',       label: 'Ventes du jour',       icon: '💰', color: '#10b981', apiPath: '/librairie/stats/ventes-jour' },
  { id: 'commandes_attente', label: 'Commandes en attente', icon: '📋', color: '#f59e0b', apiPath: '/librairie/stats/commandes-attente' },
  { id: 'stock_critique',    label: 'Stock critique',       icon: '⚠️', color: '#ef4444', apiPath: '/librairie/stats/stock-critique' },
  { id: 'caisse_jour',       label: 'Caisse du jour',       icon: '🏧', color: '#6366f1', apiPath: '/librairie/stats/caisse-jour' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',  label: 'Ventes du mois',  type: 'bar',  apiPath: '/librairie/stats/ventes-mois' },
  { id: 'ca_mensuel',   label: 'CA mensuel',      type: 'line', apiPath: '/librairie/stats/ca-mensuel' },
  { id: 'categories',   label: 'Catégories',      type: 'pie', apiPath: '/librairie/stats/repartition-categories' },
];
