export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/restaurant/dashboard' },
  { label: 'Tables',          icon: 'Utensils', path: '/restaurant/tables' },
  { label: 'Commandes',       icon: 'Clipboard', path: '/restaurant/commandes' },
  { label: 'Menu',            icon: 'BookOpen', path: '/restaurant/menu' },
  { label: 'Cuisine',         icon: 'ChefHat', path: '/restaurant/cuisine' },
  { label: 'Réservations',    icon: 'Calendar', path: '/restaurant/reservations' },
  { label: 'Caisse',          icon: 'Wallet', path: '/restaurant/caisse' },
  { label: 'Stock',           icon: 'Package', path: '/restaurant/stock' },
  { label: 'Clients',         icon: 'Users', path: '/restaurant/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/restaurant/fournisseurs' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/restaurant/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/restaurant/parametres' },
];

export const SIDEBAR_CONFIG = {
  RESTAURANT: {
    label: 'Restaurant',
    icon: 'Utensils',
    couleur: '#dc2626',
    description: 'Tables, commandes, cuisine et réservations',
    menus: SIDEBAR_MENUS,
  },
};
