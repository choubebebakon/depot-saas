export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/parfumerie/dashboard' },
  { label: 'Produits',        icon: 'SprayCan', path: '/parfumerie/produits' },
  { label: 'Catégories',      icon: 'FolderOpen', path: '/parfumerie/categories' },
  { label: 'Stock',           icon: 'Package', path: '/parfumerie/stock' },
  { label: 'Clients',         icon: '👤', path: '/parfumerie/clients' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/parfumerie/ventes' },
  { label: 'Fidélité',        icon: 'Gift', path: '/parfumerie/fidelite' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/parfumerie/fournisseurs' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/parfumerie/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/parfumerie/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/parfumerie/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/parfumerie/parametres' },
];
export const SIDEBAR_CONFIG = {
  PARFUMERIE: {
    label: 'Parfumerie / Cosmétique',
    icon: 'SprayCan',
    couleur: '#d946ef',
    description: 'Gestion des produits, ventes et fidélité client',
    menus: SIDEBAR_MENUS,
  },
};
