export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/salon/dashboard' },
  { label: 'Rendez-vous',     icon: '📋', path: '/salon/rendez-vous' },
  { label: 'Agenda',          icon: '📅', path: '/salon/agenda' },
  { label: 'Prestations',     icon: '💇', path: '/salon/prestations' },
  { label: 'Clients',         icon: '👤', path: '/salon/clients' },
  { label: 'Stock produits',  icon: '🧴', path: '/salon/stock' },
  { label: 'Ventes',          icon: '💰', path: '/salon/ventes' },
  { label: 'Dépenses',        icon: '💸', path: '/salon/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/salon/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/salon/personnel' },
  { label: 'Fidélité',        icon: '🎁', path: '/salon/abonnements' },
  { label: 'Paramètres',      icon: '⚙️', path: '/salon/parametres' },
];
export const SIDEBAR_CONFIG = {
  SALON_BEAUTE: {
    label: 'Salon de Coiffure / Beauté',
    icon: '💇',
    couleur: '#ec4899',
    description: 'Gestion des rendez-vous, prestations et clientèle',
    menus: SIDEBAR_MENUS,
  },
};
