export const DASHBOARD_WIDGETS = [
  { id: 'commandes_jour',     label: 'Commandes du jour',    icon: '🍦', color: '#06b6d4', apiPath: '/glacier/stats/commandes-jour' },
  { id: 'recettes_jour',      label: 'Recettes du jour',     icon: '💰', color: '#10b981', apiPath: '/glacier/stats/recettes-jour' },
  { id: 'parfums_populaires', label: 'Parfums populaires',   icon: '🌟', color: '#f59e0b', apiPath: '/glacier/stats/parfums-populaires' },
  { id: 'stock_critique',     label: 'Stock critique',       icon: '⚠️', color: '#ef4444', apiPath: '/glacier/stats/stock-critique' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',    label: 'Ventes du mois',    type: 'bar',  apiPath: '/glacier/stats/ventes-mois' },
  { id: 'ca_mensuel',     label: 'CA mensuel',        type: 'line', apiPath: '/glacier/stats/ca-mensuel' },
  { id: 'produits_rep',   label: 'Parfums phares',    type: 'pie', apiPath: '/glacier/stats/repartition-parfums' },
];
