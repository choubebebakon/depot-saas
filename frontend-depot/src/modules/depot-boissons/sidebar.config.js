export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/depot/dashboard' },
  { label: 'Stock',           icon: '📦', path: '/depot/stock' },
  { label: 'Articles',        icon: '🥤', path: '/depot/articles' },
  { label: 'Consignes',       icon: '🔄', path: '/depot/consignes' },
  { label: 'Livraisons',      icon: '🚚', path: '/depot/livraisons' },
  { label: 'Tournées',        icon: '🛺', path: '/depot/tournees' },
  { label: 'Clients',         icon: '👥', path: '/depot/clients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/depot/fournisseurs' },
  { label: 'Ventes',          icon: '💰', path: '/depot/ventes' },
  { label: 'Caisse',          icon: '🏧', path: '/depot/caisse' },
  { label: 'Dépenses',        icon: '💸', path: '/depot/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/depot/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/depot/parametres' },
];

export const SIDEBAR_CONFIG = {
  DEPOT_BOISSONS: {
    label: 'Dépôt de Boissons',
    icon: '🥤',
    couleur: '#2563eb',
    description: 'Gestion de stock, livraisons et consignes',
    menus: SIDEBAR_MENUS,
  },
};
