export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/boulangerie/dashboard' },
  { label: 'Production',      icon: 'Cookie', path: '/boulangerie/production' },
  { label: 'Recettes',        icon: 'FileText', path: '/boulangerie/recettes' },
  { label: 'Produits finis',  icon: 'Cookie', path: '/boulangerie/produits' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/boulangerie/ventes' },
  { label: 'Stock',           icon: 'Package', path: '/boulangerie/stock' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/boulangerie/fournisseurs' },
  { label: 'Clients',         icon: 'User', path: '/boulangerie/clients' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/boulangerie/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/boulangerie/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/boulangerie/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/boulangerie/parametres' },
];

export const SIDEBAR_CONFIG = {
  BOULANGERIE: {
    label: 'Boulangerie / Pâtisserie',
    icon: 'Cookie',
    couleur: '#d97706',
    description: 'Gestion de la production, recettes et ventes',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/boulangerie/audit-patron' },
    ],
  },
};
