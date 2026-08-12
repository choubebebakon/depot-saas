export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/librairie/dashboard' },
  { label: 'Catalogue',       icon: 'Library', path: '/librairie/catalogue' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/librairie/ventes' },
  { label: 'Commandes spé.',  icon: 'Clipboard', path: '/librairie/commandes' },
  { label: 'Stock',           icon: 'Package', path: '/librairie/stock' },
  { label: 'Caisse',          icon: 'Wallet', path: '/librairie/caisse' },
  { label: 'Clients',         icon: '👤', path: '/librairie/clients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/librairie/fournisseurs' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/librairie/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/librairie/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/librairie/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/librairie/parametres' },
];

export const SIDEBAR_CONFIG = {
  LIBRAIRIE: {
    label: 'Librairie / Papeterie',
    icon: 'Library',
    couleur: '#6366f1',
    description: 'Catalogue livres, papeterie et commandes spéciales',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/librairie/audit-patron' },
    ],
  },
};
