export const DASHBOARD_WIDGETS = [
  { id: 'colis_en_transit', label: 'Colis en transit', icon: '📦', color: '#f97316', apiPath: '/transport/stats/colis-transit' },
  { id: 'trajets_jour',     label: 'Trajets du jour',   icon: '🚛', color: '#10b981', apiPath: '/transport/stats/trajets-jour' },
  { id: 'recettes_jour',    label: 'Recettes du jour',  icon: '💰', color: '#3b82f6', apiPath: '/transport/stats/recettes-jour' },
  { id: 'flotte_active',    label: 'Flotte active',     icon: '🚚', color: '#8b5cf6', apiPath: '/transport/stats/flotte-active' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'colis_mois',     label: 'Colis du mois',    type: 'bar',  apiPath: '/transport/stats/colis-mois' },
  { id: 'ca_mensuel',     label: 'CA mensuel',       type: 'line', apiPath: '/transport/stats/ca-mensuel' },
  { id: 'destinations',   label: 'Destinations',     type: 'pie', apiPath: '/transport/stats/repartition-destinations' },
];
