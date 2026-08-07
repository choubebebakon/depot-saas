export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/glacier/dashboard' },
  { label: 'Commandes',       icon: 'Clipboard', path: '/glacier/commandes' },
  { label: 'Menu',            icon: 'BookOpen', path: '/glacier/menu' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/glacier/ventes' },
  { label: 'Stock',           icon: 'Package', path: '/glacier/stock' },
  { label: 'Caisse',          icon: 'Wallet', path: '/glacier/caisse' },
  { label: 'Clients',         icon: '👤', path: '/glacier/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/glacier/fournisseurs' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/glacier/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/glacier/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/glacier/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/glacier/parametres' },
];
export const SIDEBAR_CONFIG = {
  GLACIER_SNACK: {
    label: 'Glacier / Snack',
    icon: 'IceCream',
    couleur: '#06b6d4',
    description: 'Compositions, commandes rapides et caisse',
    menus: SIDEBAR_MENUS,
  },
};
