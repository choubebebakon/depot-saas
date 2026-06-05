export const DASHBOARD_WIDGETS = [
  { id: 'vehicules_en_cours', label: 'Véhicules en cours', icon: '🚗', color: '#f97316', apiPath: '/garage/stats/vehicules-en-cours' },
  { id: 'ordres_ouverts',     label: 'Ordres ouverts',     icon: '🔧', color: '#ef4444', apiPath: '/garage/stats/ordres-ouverts' },
  { id: 'ca_jour',            label: 'CA du jour',         icon: '💰', color: '#10b981', apiPath: '/garage/stats/ca-jour' },
  { id: 'pieces_alerte',      label: 'Pièces en alerte',   icon: '⚙️', color: '#f59e0b', apiPath: '/garage/stats/pieces-alerte' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ordres_mois',   label: 'Ordres (mois)',   type: 'bar',  apiPath: '/garage/stats/ordres-mois' },
  { id: 'ca_mensuel',    label: 'CA mensuel',      type: 'line', apiPath: '/garage/stats/ca-mensuel' },
  { id: 'statuts_rep',   label: 'Statuts répartition', type: 'pie', apiPath: '/garage/stats/statuts-repartition' },
];
