export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/parfumerie/dashboard' },
  { label: 'Produits',        icon: '🧴', path: '/parfumerie/produits' },
  { label: 'Catégories',      icon: '📁', path: '/parfumerie/categories' },
  { label: 'Stock',           icon: '📦', path: '/parfumerie/stock' },
  { label: 'Clients',         icon: '👤', path: '/parfumerie/clients' },
  { label: 'Ventes',          icon: '💰', path: '/parfumerie/ventes' },
  { label: 'Fidélité',        icon: '🎁', path: '/parfumerie/fidelite' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/parfumerie/fournisseurs' },
  { label: 'Dépenses',        icon: '💸', path: '/parfumerie/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/parfumerie/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/parfumerie/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/parfumerie/parametres' },
];
export const SIDEBAR_CONFIG = {
  PARFUMERIE: {
    label: 'Parfumerie / Cosmétique',
    icon: '🧴',
    couleur: '#d946ef',
    description: 'Gestion des produits, ventes et fidélité client',
    menus: SIDEBAR_MENUS,
  },
};
