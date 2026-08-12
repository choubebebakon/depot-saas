export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/salon/dashboard' },
  { label: 'Rendez-vous',     icon: 'Clipboard', path: '/salon/rendez-vous' },
  { label: 'Agenda',          icon: 'Calendar', path: '/salon/agenda' },
  { label: 'Prestations',     icon: 'Scissors', path: '/salon/prestations' },
  { label: 'Clients',         icon: '👤', path: '/salon/clients' },
  { label: 'Stock produits',  icon: 'SprayCan', path: '/salon/stock' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/salon/ventes' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/salon/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/salon/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/salon/personnel' },
  { label: 'Fidélité',        icon: 'Gift', path: '/salon/abonnements' },
  { label: 'Paramètres',      icon: 'Settings', path: '/salon/parametres' },
];

export const SIDEBAR_CONFIG = {
  SALON_BEAUTE: {
    label: 'Salon de Coiffure / Beauté',
    icon: 'Scissors',
    couleur: '#ec4899',
    description: 'Gestion des rendez-vous, prestations et clientèle',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/salon/audit-patron' },
    ],
  },
};
