export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/depot/dashboard' },
  { label: 'Stock', icon: 'Package', path: '/depot/stock' },
  { label: 'Inventaire', icon: 'ClipboardList', path: '/depot/inventaire' },
  { label: 'Achats & réceptions', icon: 'ShoppingCart', path: '/depot/achats' },
  { label: 'Promotions', icon: 'BadgePercent', path: '/depot/promotions' },
  { label: 'Consignes', icon: 'RefreshCw', path: '/depot/consignes' },
  { label: 'Livraisons', icon: 'Truck', path: '/depot/livraisons' },
  { label: 'Tournées', icon: 'Car', path: '/depot/tournees' },
  { label: 'Clients', icon: 'Users', path: '/depot/clients' },
  { label: 'Fournisseurs', icon: 'Factory', path: '/depot/fournisseurs' },
  { label: 'Ventes', icon: 'DollarSign', path: '/depot/ventes' },
  { label: 'Caisse', icon: 'Wallet', path: '/depot/caisse' },
  { label: 'Dépenses', icon: 'TrendingUp', path: '/depot/depenses' },
  { label: 'Rapports', icon: 'TrendingUp', path: '/depot/rapports' },
  { label: 'Paramètres', icon: 'Settings', path: '/depot/parametres' },
];

export const SIDEBAR_CONFIG = {
  DEPOT_BOISSONS: {
    label: 'Dépôt de Boissons',
    icon: 'Package',
    couleur: '#2563eb',
    description: 'Gestion de stock, livraisons, promotions et consignes',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/depot/audit-patron' },
    ],
  },
};
