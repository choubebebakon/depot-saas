export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/restaurant/dashboard' },
  { label: 'Tables',          icon: '🍽️', path: '/restaurant/tables' },
  { label: 'Commandes',       icon: '📋', path: '/restaurant/commandes' },
  { label: 'Menu',            icon: '📖', path: '/restaurant/menu' },
  { label: 'Cuisine',         icon: '👨‍🍳', path: '/restaurant/cuisine' },
  { label: 'Réservations',    icon: '📅', path: '/restaurant/reservations' },
  { label: 'Caisse',          icon: '🏧', path: '/restaurant/caisse' },
  { label: 'Stock',           icon: '📦', path: '/restaurant/stock' },
  { label: 'Clients',         icon: '👥', path: '/restaurant/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/restaurant/fournisseurs' },
  { label: 'Rapports',        icon: '📈', path: '/restaurant/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/restaurant/parametres' },
];

export const SIDEBAR_CONFIG = {
  RESTAURANT: {
    label: 'Restaurant',
    icon: '🍽️',
    couleur: '#dc2626',
    description: 'Tables, commandes, cuisine et réservations',
    menus: SIDEBAR_MENUS,
  },
};
