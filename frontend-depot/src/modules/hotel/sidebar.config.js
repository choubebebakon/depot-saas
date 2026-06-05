export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/hotel/dashboard' },
  { label: 'Chambres',        icon: '🛏️', path: '/hotel/chambres' },
  { label: 'Réservations',    icon: '📅', path: '/hotel/reservations' },
  { label: 'Clients',         icon: '👥', path: '/hotel/clients' },
  { label: 'Facturation',     icon: '🧾', path: '/hotel/facturation' },
  { label: 'Personnel',       icon: '👨‍💼', path: '/hotel/personnel' },
  { label: 'Ménage',          icon: '🧹', path: '/hotel/menage' },
  { label: 'Services',        icon: '🛎️', path: '/hotel/services' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/hotel/fournisseurs' },
  { label: 'Rapports',        icon: '📈', path: '/hotel/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/hotel/parametres' },
];

export const SIDEBAR_CONFIG = {
  HOTEL: {
    label: 'Hôtel',
    icon: '🏨',
    couleur: '#8b5cf6',
    description: 'Chambres, réservations, ménage et services hôteliers',
    menus: SIDEBAR_MENUS,
  },
};
