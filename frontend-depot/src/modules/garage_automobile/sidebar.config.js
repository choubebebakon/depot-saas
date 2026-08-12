export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/garage/dashboard' },
  { label: 'Véhicules',       icon: '🚗', path: '/garage/vehicules' },
  { label: 'Ordres de réparation', icon: 'Wrench', path: '/garage/ordres' },
  { label: 'Devis',           icon: '📄', path: '/garage/devis' },
  { label: 'Clients',         icon: '👤', path: '/garage/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/garage/fournisseurs' },
  { label: 'Stock pièces',    icon: 'Settings', path: '/garage/pieces' },
  { label: 'Personnel',       icon: 'Users', path: '/garage/personnel' },
  { label: 'Caisse',          icon: 'DollarSign', path: '/garage/caisse' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/garage/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/garage/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/garage/parametres' },
];

export const SIDEBAR_CONFIG = {
  GARAGE_AUTOMOBILE: {
    label: 'Garage Automobile',
    icon: 'Wrench',
    couleur: '#f97316',
    description: 'Gestion des réparations, entretien et pièces détachées',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/garage/audit-patron' },
    ],
  },
};
