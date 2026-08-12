export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/boutique/dashboard' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/boutique/ventes' },
  { label: 'Stock',           icon: 'Package', path: '/boutique/stock' },
  { label: 'Clients',         icon: '👤', path: '/boutique/clients' },
  { label: 'Caisse',          icon: 'Wallet', path: '/boutique/caisse' },
  { label: 'Catégories',      icon: 'Tag', path: '/boutique/categories' },
  { label: 'Promotions',      icon: 'Tag', path: '/boutique/promotions' },
  { label: 'Factures',        icon: '📄', path: '/boutique/factures' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/boutique/fournisseurs' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/boutique/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/boutique/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/boutique/parametres' },
];

export const SIDEBAR_CONFIG = {
  BOUTIQUE: {
    label: 'Boutique',
    icon: 'ShoppingBag',
    couleur: '#0891b2',
    description: 'Ventes, caisse, stock et fidélité client',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/boutique/audit-patron' },
    ],
  },
};