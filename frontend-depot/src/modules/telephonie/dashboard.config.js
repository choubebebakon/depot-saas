export const DASHBOARD_WIDGETS = [
  { id: 'telephones_stock', label: 'Téléphones stock', icon: '📱', color: '#7c3aed', apiPath: '/telephonie/stats/telephones-stock' },
  { id: 'reparations_en_cours', label: 'Réparations en cours', icon: '🔧', color: '#ef4444', apiPath: '/telephonie/stats/reparations-en-cours' },
  { id: 'ca_jour', label: 'CA du jour', icon: '💰', color: '#10b981', apiPath: '/telephonie/stats/ca-jour' },
  { id: 'recharges_jour', label: 'Recharges jour', icon: '🔋', color: '#f59e0b', apiPath: '/telephonie/stats/recharges-jour' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',   label: 'Ventes (mois)',   type: 'bar',  apiPath: '/telephonie/stats/ventes-mois' },
  { id: 'ca_mensuel',    label: 'CA mensuel',      type: 'line', apiPath: '/telephonie/stats/ca-mensuel' },
  { id: 'reparations_rep', label: 'Réparations types', type: 'pie', apiPath: '/telephonie/stats/reparations-repartition' },
];
