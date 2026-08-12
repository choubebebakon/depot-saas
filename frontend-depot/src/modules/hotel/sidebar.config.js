export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/hotel/dashboard' },
  { label: 'Chambres',        icon: 'Bed', path: '/hotel/chambres' },
  { label: 'Réservations',    icon: 'Calendar', path: '/hotel/reservations' },
  { label: 'Clients',         icon: 'Users', path: '/hotel/clients' },
  { label: 'Facturation',     icon: 'Receipt', path: '/hotel/facturation' },
  { label: 'Personnel',       icon: '👨‍💼', path: '/hotel/personnel' },
  { label: 'Ménage',          icon: 'Broom', path: '/hotel/menage' },
  { label: 'Services',        icon: 'Bell', path: '/hotel/services' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/hotel/fournisseurs' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/hotel/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/hotel/parametres' },
];

export const SIDEBAR_CONFIG = {
  HOTEL: {
    label: 'Hôtel',
    icon: 'Hotel',
    couleur: '#8b5cf6',
    description: 'Chambres, réservations, ménage et services hôteliers',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/hotel/audit-patron' },
    ],
  },
};
