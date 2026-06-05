export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/transport/dashboard' },
  { label: 'Colis',           icon: '📦', path: '/transport/colis' },
  { label: 'Trajets',         icon: '🚛', path: '/transport/trajets' },
  { label: 'Flotte',          icon: '🚚', path: '/transport/flotte' },
  { label: 'Chauffeurs',      icon: '👨‍✈️', path: '/transport/chauffeurs' },
  { label: 'Livraisons',      icon: '📋', path: '/transport/livraisons' },
  { label: 'Clients',         icon: '👤', path: '/transport/clients' },
  { label: 'Caisse',          icon: '🏧', path: '/transport/caisse' },
  { label: 'Dépenses',        icon: '💸', path: '/transport/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/transport/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/transport/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/transport/parametres' },
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
