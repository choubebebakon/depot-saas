export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/pressing/dashboard' },
  { label: 'Tickets dépôts',  icon: 'Tag', path: '/pressing/tickets' },
  { label: 'Clients',         icon: '👤', path: '/pressing/clients' },
  { label: 'Services',        icon: '🧼', path: '/pressing/services' },
  { label: 'Commandes',       icon: 'Clipboard', path: '/pressing/commandes' },
  { label: 'Stock',           icon: 'Package', path: '/pressing/stock' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/pressing/ventes' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/pressing/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/pressing/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/pressing/personnel' },
  { label: 'Calendrier',      icon: 'Calendar', path: '/pressing/calendrier' },
  { label: 'Paramètres',      icon: 'Settings', path: '/pressing/parametres' },
];
export const SIDEBAR_CONFIG = {
  PRESSING: {
    label: 'Pressing',
    icon: 'Shirt',
    couleur: '#7c3aed',
    description: 'Gestion des dépôts, lavages, retraits et services',
    menus: SIDEBAR_MENUS,
  },
};
