export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/supermarche/dashboard' },
  { label: 'POS/Caisse',     icon: '🛒', path: '/supermarche/pos' },
  { label: 'Stock',          icon: '📦', path: '/supermarche/stock' },
  { label: 'Rayons',         icon: '🗂️', path: '/supermarche/rayons' },
  { label: 'Promotions',     icon: '🏷️', path: '/supermarche/promotions' },
  { label: 'Clients',        icon: '👥', path: '/supermarche/clients' },
  { label: 'Fournisseurs',   icon: '🏭', path: '/supermarche/fournisseurs' },
  { label: 'Réceptions',     icon: '📦', path: '/supermarche/receptions' },
  { label: 'Inventaire',     icon: '📊', path: '/supermarche/inventaire' },
  { label: 'Dépenses',       icon: '💸', path: '/supermarche/depenses' },
  { label: 'Rapports',       icon: '📈', path: '/supermarche/rapports' },
  { label: 'Paramètres',     icon: '⚙️', path: '/supermarche/parametres' },
];

export const SIDEBAR_CONFIG = {
  SUPERMARCHE: {
    label: 'Supermarché',
    icon: '🛒',
    couleur: '#f59e0b',
    description: 'Gestion de supermarché, caisse, rayons, code-barres et promotions',
    menus: SIDEBAR_MENUS,
  },
};
