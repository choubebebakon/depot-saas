export const DASHBOARD_WIDGETS = [
  { id: 'animaux_total',   label: 'Animaux total',      icon: '🐄', color: '#65a30d', apiPath: '/elevage/stats/animaux-total' },
  { id: 'mortalite_mois',  label: 'Mortalité (mois)',   icon: '⚠️', color: '#ef4444', apiPath: '/elevage/stats/mortalite-mois' },
  { id: 'ventes_jour',     label: 'Ventes du jour',     icon: '💰', color: '#10b981', apiPath: '/elevage/stats/ventes-jour' },
  { id: 'stock_aliment',   label: 'Stock aliment',      icon: '🌾', color: '#f59e0b', apiPath: '/elevage/stats/stock-aliment' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'naissance_mois',  label: 'Naissances (mois)',  type: 'bar',  apiPath: '/elevage/stats/naissance-mois' },
  { id: 'especes_repart',  label: 'Répartition espèces',type: 'pie',  apiPath: '/elevage/stats/especes-repartition' },
  { id: 'poids_suivi',     label: 'Suivi poids',        type: 'line', apiPath: '/elevage/stats/poids-suivi' },
];
