export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/boutique/dashboard' },
  { label: 'Caisse POS',     icon: 'DollarSign', path: '/boutique/ventes-caisse' },
  { label: 'Stock',           icon: 'Package', path: '/boutique/stock' },
  { label: 'Inventaire',      icon: 'Clipboard', path: '/boutique/inventaire' },
  { label: 'Clients',         icon: 'User', path: '/boutique/clients' },
  { label: 'Catégories',      icon: 'Tag', path: '/boutique/categories' },
  { label: 'Promotions',      icon: 'Tag', path: '/boutique/promotions' },
  { label: 'Factures',        icon: 'FileText', path: '/boutique/factures' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/boutique/fournisseurs' },
  { label: 'Réceptions',      icon: 'Package', path: '/boutique/receptions' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/boutique/depenses' },
  { label: 'Rapports Ventes', icon: 'TrendingUp', path: '/boutique/rapports-ventes' },
  { label: 'Rapports Stock',  icon: 'Package', path: '/boutique/rapports-stock' },
  { label: 'Rapports Financiers', icon: 'DollarSign', path: '/boutique/rapports-financiers' },
  { label: 'Mes Performances', icon: 'BarChart3', path: '/boutique/performance' },
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
