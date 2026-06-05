export const DASHBOARD_WIDGETS = [
  { id: 'biens_occupes',    label: 'Biens occupés',       icon: '🏠', color: '#14b8a6', apiPath: '/immobilier/stats/biens-occupes' },
  { id: 'loyers_mois',      label: 'Loyers du mois',      icon: '💰', color: '#10b981', apiPath: '/immobilier/stats/loyers-mois' },
  { id: 'retards_paiement', label: 'Paiements en retard', icon: '⚠️', color: '#ef4444', apiPath: '/immobilier/stats/retards' },
  { id: 'revenus',          label: 'Revenus annuels',     icon: '📈', color: '#3b82f6', apiPath: '/immobilier/stats/revenus' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'loyers_mensuels', label: 'Loyers mensuels', type: 'bar',  apiPath: '/immobilier/stats/loyers-mensuels' },
  { id: 'taux_occupation', label: "Taux d'occupation", type: 'line', apiPath: '/immobilier/stats/taux-occupation' },
  { id: 'type_biens',      label: 'Types de biens',   type: 'pie', apiPath: '/immobilier/stats/repartition-types' },
];
