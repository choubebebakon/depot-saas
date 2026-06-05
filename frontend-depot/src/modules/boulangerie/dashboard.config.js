export const DASHBOARD_WIDGETS = [
  { id: 'production_jour', label: 'Production du jour', icon: '🥖', color: '#d97706', apiPath: '/boulangerie/stats/production-jour' },
  { id: 'ventes_jour',     label: 'Ventes du jour',     icon: '💰', color: '#10b981', apiPath: '/boulangerie/stats/ventes-jour' },
  { id: 'stock_critique',  label: 'Stock critique',     icon: '⚠️', color: '#ef4444', apiPath: '/boulangerie/stats/stock-critique' },
  { id: 'invendus',        label: 'Invendus',           icon: '📉', color: '#f59e0b', apiPath: '/boulangerie/stats/invendus' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',    label: 'Ventes (mois)',    type: 'bar',  apiPath: '/boulangerie/stats/ventes-mois' },
  { id: 'ca_mensuel',     label: 'CA mensuel',       type: 'line', apiPath: '/boulangerie/stats/ca-mensuel' },
  { id: 'produits_rep',   label: 'Produits phares',  type: 'pie', apiPath: '/boulangerie/stats/produits-repartition' },
];
