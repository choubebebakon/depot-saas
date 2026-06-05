export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/boulangerie/dashboard' },
  { label: 'Production',      icon: '🥖', path: '/boulangerie/production' },
  { label: 'Recettes',        icon: '📝', path: '/boulangerie/recettes' },
  { label: 'Produits finis',  icon: '🥐', path: '/boulangerie/produits' },
  { label: 'Ventes',          icon: '💰', path: '/boulangerie/ventes' },
  { label: 'Stock',           icon: '📦', path: '/boulangerie/stock' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/boulangerie/fournisseurs' },
  { label: 'Clients',         icon: '👤', path: '/boulangerie/clients' },
  { label: 'Dépenses',        icon: '💸', path: '/boulangerie/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/boulangerie/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/boulangerie/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/boulangerie/parametres' },
];
export const SIDEBAR_CONFIG = {
  BOULANGERIE: {
    label: 'Boulangerie / Pâtisserie',
    icon: '🥖',
    couleur: '#d97706',
    description: 'Gestion de la production, recettes et ventes',
    menus: SIDEBAR_MENUS,
  },
};
