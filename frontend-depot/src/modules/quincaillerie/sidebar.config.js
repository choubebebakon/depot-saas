export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/quincaillerie/dashboard' },
  { label: 'Produits',        icon: 'Wrench', path: '/quincaillerie/produits' },
  { label: 'Catégories',      icon: 'FolderOpen', path: '/quincaillerie/categories' },
  { label: 'Stock',           icon: 'Package', path: '/quincaillerie/stock' },
  { label: 'Clients',         icon: '👤', path: '/quincaillerie/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/quincaillerie/fournisseurs' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/quincaillerie/ventes' },
  { label: 'Chantiers',       icon: 'HardHat', path: '/quincaillerie/chantiers' },
  { label: 'Devis',           icon: '📄', path: '/quincaillerie/devis' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/quincaillerie/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/quincaillerie/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/quincaillerie/parametres' },
];

export const SIDEBAR_CONFIG = {
  QUINCAILLERIE: {
    label: 'Quincaillerie',
    icon: 'Wrench',
    couleur: '#b45309',
    description: 'Gestion des produits, stock et chantiers',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/quincaillerie/audit-patron' },
    ],
  },
};
