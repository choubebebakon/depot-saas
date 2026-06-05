export const DASHBOARD_WIDGETS = [
  { id: 'ventes_jour',    label: 'Ventes du jour',    icon: '💰', color: '#10b981', apiPath: '/boutique/stats/ventes-jour' },
  { id: 'stock_critique', label: 'Ruptures de stock', icon: '⚠️', color: '#f59e0b', apiPath: '/boutique/stats/stock-critique' },
  { id: 'clients_actifs', label: 'Clients actifs',    icon: '👤', color: '#3b82f6', apiPath: '/boutique/stats/clients-actifs' },
  { id: 'caisse_jour',    label: 'Caisse du jour',    icon: '🏧', color: '#8b5cf6', apiPath: '/boutique/stats/caisse-jour' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois', label: 'Ventes du mois', type: 'bar',  apiPath: '/boutique/stats/ventes-mois' },
  { id: 'ca_mensuel',  label: 'CA mensuel',      type: 'line', apiPath: '/boutique/stats/ca-mensuel' },
  { id: 'categories',  label: 'Catégories',       type: 'pie', apiPath: '/boutique/stats/repartition-categories' },
];
