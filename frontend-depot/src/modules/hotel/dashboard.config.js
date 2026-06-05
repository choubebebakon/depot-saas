export const DASHBOARD_WIDGETS = [
  { id: 'chambres_occupees', label: 'Chambres occupées',   icon: '🛏️', color: '#8b5cf6', apiPath: '/hotel/stats/chambres-occupees' },
  { id: 'reservations_jour', label: 'Réservations jour',   icon: '📅', color: '#3b82f6', apiPath: '/hotel/stats/reservations-jour' },
  { id: 'revenus_jour',      label: 'Revenus du jour',     icon: '💰', color: '#10b981', apiPath: '/hotel/stats/revenus-jour' },
  { id: 'taux_occupation',   label: "Taux d'occupation",   icon: '📈', color: '#f59e0b', apiPath: '/hotel/stats/taux-occupation' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'occupation_mois',   label: "Occupation du mois",  type: 'bar',  apiPath: '/hotel/stats/occupation-mois' },
  { id: 'type_chambres',     label: 'Type de chambres',    type: 'pie',  apiPath: '/hotel/stats/type-chambres' },
  { id: 'revenus_annee',     label: 'Revenus annuels',     type: 'line', apiPath: '/hotel/stats/revenus-annee' },
];
