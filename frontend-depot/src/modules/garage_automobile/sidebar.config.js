export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/garage/dashboard' },
  { label: 'Véhicules',       icon: '🚗', path: '/garage/vehicules' },
  { label: 'Ordres de réparation', icon: '🔧', path: '/garage/ordres' },
  { label: 'Devis',           icon: '📄', path: '/garage/devis' },
  { label: 'Clients',         icon: '👤', path: '/garage/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/garage/fournisseurs' },
  { label: 'Stock pièces',    icon: '⚙️', path: '/garage/pieces' },
  { label: 'Personnel',       icon: '👥', path: '/garage/personnel' },
  { label: 'Caisse',          icon: '💰', path: '/garage/caisse' },
  { label: 'Dépenses',        icon: '💸', path: '/garage/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/garage/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/garage/parametres' },
];
export const SIDEBAR_CONFIG = {
  GARAGE_AUTOMOBILE: {
    label: 'Garage Automobile',
    icon: '🔧',
    couleur: '#f97316',
    description: 'Gestion des réparations, entretien et pièces détachées',
    menus: SIDEBAR_MENUS,
  },
};
