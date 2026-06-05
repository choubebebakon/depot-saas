export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/telephonie/dashboard' },
  { label: 'Téléphones',      icon: '📱', path: '/telephonie/telephones' },
  { label: 'Accessoires',     icon: '🎧', path: '/telephonie/accessoires' },
  { label: 'Réparations',     icon: '🔧', path: '/telephonie/reparations' },
  { label: 'Clients',         icon: '👤', path: '/telephonie/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/telephonie/fournisseurs' },
  { label: 'Ventes',          icon: '💰', path: '/telephonie/ventes' },
  { label: 'Recharges',       icon: '🔋', path: '/telephonie/recharges' },
  { label: 'Stock',           icon: '📦', path: '/telephonie/stock' },
  { label: 'Dépenses',        icon: '💸', path: '/telephonie/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/telephonie/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/telephonie/parametres' },
];
export const SIDEBAR_CONFIG = {
  TELEPHONIE: {
    label: 'Téléphonie',
    icon: '📱',
    couleur: '#7c3aed',
    description: 'Gestion des téléphones, accessoires et réparations',
    menus: SIDEBAR_MENUS,
  },
};
