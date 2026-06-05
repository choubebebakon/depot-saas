export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/glacier/dashboard' },
  { label: 'Commandes',       icon: '📋', path: '/glacier/commandes' },
  { label: 'Menu',            icon: '📖', path: '/glacier/menu' },
  { label: 'Ventes',          icon: '💰', path: '/glacier/ventes' },
  { label: 'Stock',           icon: '📦', path: '/glacier/stock' },
  { label: 'Caisse',          icon: '🏧', path: '/glacier/caisse' },
  { label: 'Clients',         icon: '👤', path: '/glacier/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/glacier/fournisseurs' },
  { label: 'Dépenses',        icon: '💸', path: '/glacier/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/glacier/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/glacier/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/glacier/parametres' },
];
export const SIDEBAR_CONFIG = {
  GLACIER_SNACK: {
    label: 'Glacier / Snack',
    icon: '🍦',
    couleur: '#06b6d4',
    description: 'Compositions, commandes rapides et caisse',
    menus: SIDEBAR_MENUS,
  },
};
