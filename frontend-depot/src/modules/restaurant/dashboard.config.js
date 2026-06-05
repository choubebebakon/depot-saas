export const DASHBOARD_WIDGETS = [
  { id: 'tables_occupees',  label: 'Tables occupées',    icon: '🍽️', color: '#dc2626', apiPath: '/restaurant/stats/tables-occupees' },
  { id: 'commandes_cours',  label: 'Commandes en cours',  icon: '📋', color: '#f59e0b', apiPath: '/restaurant/stats/commandes-cours' },
  { id: 'recettes_jour',    label: 'Recettes du jour',   icon: '💰', color: '#10b981', apiPath: '/restaurant/stats/recettes-jour' },
  { id: 'reservations_jour',label: 'Réservations jour',  icon: '📅', color: '#3b82f6', apiPath: '/restaurant/stats/reservations-jour' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'recettes_mois',    label: 'Recettes du mois',   type: 'bar',  apiPath: '/restaurant/stats/recettes-mois' },
  { id: 'plats_populaires', label: 'Plats populaires',    type: 'pie',  apiPath: '/restaurant/stats/plats-populaires' },
  { id: 'affluence_semaine',label: 'Affluence semaine',   type: 'line', apiPath: '/restaurant/stats/affluence-semaine' },
];
