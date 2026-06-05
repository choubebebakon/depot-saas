export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/ciment-btp/dashboard' },
  { label: 'Ventes',          icon: '💰', path: '/ciment-btp/ventes' },
  { label: 'Devis',           icon: '📋', path: '/ciment-btp/devis' },
  { label: 'Chantiers',       icon: '🏗️', path: '/ciment-btp/chantiers' },
  { label: 'Livraisons',      icon: '🚚', path: '/ciment-btp/livraisons' },
  { label: 'Véhicules',       icon: '🚛', path: '/ciment-btp/vehicules' },
  { label: 'Stock',           icon: '📦', path: '/ciment-btp/stock' },
  { label: 'Clients',         icon: '👤', path: '/ciment-btp/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/ciment-btp/fournisseurs' },
  { label: 'Rapports',        icon: '📈', path: '/ciment-btp/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/ciment-btp/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/ciment-btp/parametres' },
];
export const SIDEBAR_CONFIG = {
  CIMENT_BTP: {
    label: 'Ciment / BTP',
    icon: '🏗️',
    couleur: '#b45309',
    description: 'Gestion des livraisons, véhicules et chantiers',
    menus: SIDEBAR_MENUS,
  },
};
