export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/quincaillerie/dashboard' },
  { label: 'Produits',        icon: '🛠', path: '/quincaillerie/produits' },
  { label: 'Catégories',      icon: '📁', path: '/quincaillerie/categories' },
  { label: 'Stock',           icon: '📦', path: '/quincaillerie/stock' },
  { label: 'Clients',         icon: '👤', path: '/quincaillerie/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/quincaillerie/fournisseurs' },
  { label: 'Ventes',          icon: '💰', path: '/quincaillerie/ventes' },
  { label: 'Chantiers',       icon: '🏗️', path: '/quincaillerie/chantiers' },
  { label: 'Devis',           icon: '📄', path: '/quincaillerie/devis' },
  { label: 'Dépenses',        icon: '💸', path: '/quincaillerie/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/quincaillerie/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/quincaillerie/parametres' },
];
export const SIDEBAR_CONFIG = {
  QUINCAILLERIE: {
    label: 'Quincaillerie',
    icon: '🛠',
    couleur: '#b45309',
    description: 'Gestion des produits, stock et chantiers',
    menus: SIDEBAR_MENUS,
  },
};
