export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/ciment-btp/dashboard' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/ciment-btp/ventes' },
  { label: 'Devis',           icon: 'Clipboard', path: '/ciment-btp/devis' },
  { label: 'Chantiers',       icon: 'HardHat', path: '/ciment-btp/chantiers' },
  { label: 'Livraisons',      icon: 'Truck', path: '/ciment-btp/livraisons' },
  { label: 'Véhicules',       icon: '🚛', path: '/ciment-btp/vehicules' },
  { label: 'Stock',           icon: 'Package', path: '/ciment-btp/stock' },
  { label: 'Clients',         icon: '👤', path: '/ciment-btp/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/ciment-btp/fournisseurs' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/ciment-btp/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/ciment-btp/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/ciment-btp/parametres' },
];
export const SIDEBAR_CONFIG = {
  CIMENT_BTP: {
    label: 'Ciment / BTP',
    icon: 'HardHat',
    couleur: '#b45309',
    description: 'Gestion des livraisons, véhicules et chantiers',
    menus: SIDEBAR_MENUS,
  },
};
