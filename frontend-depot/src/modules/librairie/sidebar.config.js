export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/librairie/dashboard' },
  { label: 'Catalogue',       icon: '📚', path: '/librairie/catalogue' },
  { label: 'Ventes',          icon: '💰', path: '/librairie/ventes' },
  { label: 'Commandes spé.',  icon: '📋', path: '/librairie/commandes' },
  { label: 'Stock',           icon: '📦', path: '/librairie/stock' },
  { label: 'Caisse',          icon: '🏧', path: '/librairie/caisse' },
  { label: 'Clients',         icon: '👤', path: '/librairie/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/librairie/fournisseurs' },
  { label: 'Dépenses',        icon: '💸', path: '/librairie/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/librairie/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/librairie/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/librairie/parametres' },
];
export const SIDEBAR_CONFIG = {
  LIBRAIRIE: {
    label: 'Librairie / Papeterie',
    icon: '📚',
    couleur: '#6366f1',
    description: 'Catalogue livres, papeterie et commandes spéciales',
    menus: SIDEBAR_MENUS,
  },
};
