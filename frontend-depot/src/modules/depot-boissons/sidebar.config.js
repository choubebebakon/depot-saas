export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/depot/dashboard' },
  { label: 'Ventes/Caisse', icon: 'Wallet', path: '/depot/caisse' },
  { label: 'Factures', icon: 'FileText', path: '/depot/factures' },
  { label: 'Stock', icon: 'Package', path: '/depot/stock' },
  { label: 'Achats & réceptions', icon: 'ShoppingCart', path: '/depot/achats' },
  { label: 'Promotions', icon: 'Tag', path: '/depot/promotions' },
  { label: 'Consignes', icon: 'RefreshCw', path: '/depot/consignes' },
  { label: 'Livraisons', icon: 'Truck', path: '/depot/livraisons' },
  { label: 'Tournées', icon: 'Car', path: '/depot/tournees' },
  { label: 'Clients', icon: 'Users', path: '/depot/clients' },
  { label: 'Fournisseurs', icon: 'Factory', path: '/depot/fournisseurs' },
  { label: 'Inventaire', icon: 'Clipboard', path: '/depot/inventaire' },
  { label: 'Dépenses', icon: 'TrendingUp', path: '/depot/depenses' },
  { label: 'Rapports Ventes', icon: 'TrendingUp', path: '/depot/rapports-ventes' },
  { label: 'Rapports Stock', icon: 'Package', path: '/depot/rapports-stock' },
  { label: 'Rapports Financiers', icon: 'DollarSign', path: '/depot/rapports-financiers' },
  { label: 'Mes Performances', icon: 'BarChart3', path: '/depot/performance' },
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
