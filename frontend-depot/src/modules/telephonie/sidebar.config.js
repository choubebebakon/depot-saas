export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/telephonie/dashboard' },
  { label: 'Téléphones',      icon: 'Smartphone', path: '/telephonie/telephones' },
  { label: 'Accessoires',     icon: 'Headphones', path: '/telephonie/accessoires' },
  { label: 'Réparations',     icon: 'Wrench', path: '/telephonie/reparations' },
  { label: 'Clients',         icon: '👤', path: '/telephonie/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/telephonie/fournisseurs' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/telephonie/ventes' },
  { label: 'Recharges',       icon: 'Battery', path: '/telephonie/recharges' },
  { label: 'Stock',           icon: 'Package', path: '/telephonie/stock' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/telephonie/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/telephonie/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/telephonie/parametres' },
];
export const SIDEBAR_CONFIG = {
  TELEPHONIE: {
    label: 'Téléphonie',
    icon: 'Smartphone',
    couleur: '#7c3aed',
    description: 'Gestion des téléphones, accessoires et réparations',
    menus: SIDEBAR_MENUS,
  },
};
