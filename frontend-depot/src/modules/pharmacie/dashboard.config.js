export const DASHBOARD_WIDGETS = [
  { id: 'ventes_jour',      label: 'Ventes du jour',       icon: '💰', color: '#10b981', apiPath: '/pharmacie/stats/ventes-jour' },
  { id: 'ordonnances',      label: 'Ordonnances jour',      icon: '📝', color: '#3b82f6', apiPath: '/pharmacie/stats/ordonnances' },
  { id: 'alertes_dlc',      label: 'Alertes DLC',           icon: '⏰', color: '#ef4444', apiPath: '/pharmacie/stats/alertes-dlc' },
  { id: 'stock_critique',   label: 'Stock critique',        icon: '⚠️', color: '#f59e0b', apiPath: '/pharmacie/stats/stock-critique' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',      label: 'Ventes du mois',       type: 'bar', apiPath: '/pharmacie/stats/ventes-mois' },
  { id: 'top_medicaments',  label: 'Top médicaments',       type: 'pie', apiPath: '/pharmacie/stats/top-medicaments' },
  { id: 'alertes_dlc_30j',  label: 'DLC à surveiller (30j)',type: 'line',apiPath: '/pharmacie/stats/alertes-dlc-30j' },
];
