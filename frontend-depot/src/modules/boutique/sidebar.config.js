export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/boutique/dashboard' },
  { label: 'Ventes',          icon: '💰', path: '/boutique/ventes' },
  { label: 'Stock',           icon: '📦', path: '/boutique/stock' },
  { label: 'Clients',         icon: '👤', path: '/boutique/clients' },
  { label: 'Caisse',          icon: '🏧', path: '/boutique/caisse' },
  { label: 'Catégories',      icon: '🏷️', path: '/boutique/categories' },
  { label: 'Promotions',      icon: '🏷️', path: '/boutique/promotions' },
  { label: 'Factures',        icon: '📄', path: '/boutique/factures' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/boutique/fournisseurs' },
  { label: 'Dépenses',        icon: '💸', path: '/boutique/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/boutique/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/boutique/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/boutique/parametres' },
];
export const SIDEBAR_CONFIG = {
  BOUTIQUE: {
    label: 'Boutique',
    icon: '🏪',
    couleur: '#0891b2',
    description: 'Ventes, caisse, stock et fidélité client',
    menus: SIDEBAR_MENUS,
  },
};
