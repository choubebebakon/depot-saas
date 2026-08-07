export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/supermarche/dashboard' },
  { label: 'POS/Caisse',     icon: 'ShoppingCart', path: '/supermarche/pos' },
  { label: 'Stock',          icon: 'Package', path: '/supermarche/stock' },
  { label: 'Rayons',         icon: '🗂️', path: '/supermarche/rayons' },
  { label: 'Promotions',     icon: 'Tag', path: '/supermarche/promotions' },
  { label: 'Clients',        icon: 'Users', path: '/supermarche/clients' },
  { label: 'Fournisseurs',   icon: 'Factory', path: '/supermarche/fournisseurs' },
  { label: 'Réceptions',     icon: 'Package', path: '/supermarche/receptions' },
  { label: 'Inventaire',     icon: 'BarChart3', path: '/supermarche/inventaire' },
  { label: 'Dépenses',       icon: 'TrendingUp', path: '/supermarche/depenses' },
  { label: 'Rapports',       icon: 'TrendingUp', path: '/supermarche/rapports' },
  { label: 'Paramètres',     icon: 'Settings', path: '/supermarche/parametres' },
];

export const SIDEBAR_CONFIG = {
  SUPERMARCHE: {
    label: 'Supermarché',
    icon: 'ShoppingCart',
    couleur: '#f59e0b',
    description: 'Gestion de supermarché, caisse, rayons, code-barres et promotions',
    menus: SIDEBAR_MENUS,
  },
};
