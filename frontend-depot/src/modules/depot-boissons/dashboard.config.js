export const DASHBOARD_WIDGETS = [
  { id: 'ventes_jour',      label: 'Ventes du jour',       icon: '💰', color: '#10b981', apiPath: '/depot-boissons/stats/ventes-jour' },
  { id: 'stock_critique',   label: 'Stock critique',       icon: '⚠️',  color: '#f59e0b', apiPath: '/depot-boissons/stats/stock-critique' },
  { id: 'livraisons_cours', label: 'Livraisons en cours',  icon: '🚚', color: '#3b82f6', apiPath: '/depot-boissons/stats/livraisons' },
  { id: 'caisse_jour',      label: 'Caisse du jour',       icon: '🏧', color: '#8b5cf6', apiPath: '/depot-boissons/stats/caisse-jour' },
  { id: 'clients_debiteurs',label: 'Clients débiteurs',    icon: '👥', color: '#ef4444', apiPath: '/depot-boissons/stats/clients-debiteurs' },
  { id: 'tournees_actives', label: 'Tournées actives',     icon: '🛺', color: '#06b6d4', apiPath: '/depot-boissons/stats/tournees' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'ventes_30j',       label: 'Ventes 30 jours',      type: 'bar', apiPath: '/depot-boissons/stats/ventes-30j' },
  { id: 'top_articles',     label: 'Top articles',         type: 'pie', apiPath: '/depot-boissons/stats/top-articles' },
  { id: 'evolution_stock',  label: 'Évolution stock',      type: 'line', apiPath: '/depot-boissons/stats/evolution-stock' },
];
