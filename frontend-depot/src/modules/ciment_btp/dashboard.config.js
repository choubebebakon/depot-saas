export const DASHBOARD_WIDGETS = [
  { id: 'chantiers_actifs', label: 'Chantiers actifs',  icon: '🏗️', color: '#3b82f6', apiPath: '/ciment-btp/stats/chantiers-actifs' },
  { id: 'livraisons_jour',  label: 'Livraisons jour',   icon: '🚚', color: '#f59e0b', apiPath: '/ciment-btp/stats/livraisons-jour' },
  { id: 'devis_attente',    label: 'Devis en attente',   icon: '📋', color: '#ef4444', apiPath: '/ciment-btp/stats/devis-attente' },
  { id: 'stock_critique',   label: 'Stock critique',    icon: '⚠️', color: '#8b5cf6', apiPath: '/ciment-btp/stats/stock-critique' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',   label: 'Ventes du mois',   type: 'bar',  apiPath: '/ciment-btp/stats/ventes-mois' },
  { id: 'ca_mensuel',    label: 'CA mensuel',       type: 'line', apiPath: '/ciment-btp/stats/ca-mensuel' },
  { id: 'produits_rep',  label: 'Produits phares',  type: 'pie', apiPath: '/ciment-btp/stats/repartition-produits' },
];
