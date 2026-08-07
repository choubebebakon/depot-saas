export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/transport/dashboard' },
  { label: 'Colis',           icon: 'Package', path: '/transport/colis' },
  { label: 'Trajets',         icon: '🚛', path: '/transport/trajets' },
  { label: 'Flotte',          icon: 'Truck', path: '/transport/flotte' },
  { label: 'Chauffeurs',      icon: '👨‍✈️', path: '/transport/chauffeurs' },
  { label: 'Livraisons',      icon: 'Clipboard', path: '/transport/livraisons' },
  { label: 'Clients',         icon: '👤', path: '/transport/clients' },
  { label: 'Caisse',          icon: 'Wallet', path: '/transport/caisse' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/transport/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/transport/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/transport/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/transport/parametres' },
];
export const SIDEBAR_CONFIG = {
  TRANSPORT: {
    label: 'Transport / Logistique',
    icon: '🚛',
    couleur: '#f97316',
    description: 'Suivi colis, flotte véhicules et trajets',
    menus: SIDEBAR_MENUS,
  },
};
