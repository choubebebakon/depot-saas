export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/immobilier/dashboard' },
  { label: 'Biens',           icon: 'Home', path: '/immobilier/biens' },
  { label: 'Contrats',        icon: 'Clipboard', path: '/immobilier/contrats' },
  { label: 'Loyers',          icon: 'DollarSign', path: '/immobilier/loyers' },
  { label: 'Locataires',      icon: 'Users', path: '/immobilier/locataires' },
  { label: 'Interventions',   icon: 'Wrench', path: '/immobilier/interventions' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/immobilier/depenses' },
  { label: 'Documents',       icon: '📄', path: '/immobilier/documents' },
  { label: 'Visites',         icon: 'Calendar', path: '/immobilier/visites' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/immobilier/rapports' },
  { label: 'Personnel',       icon: 'Users', path: '/immobilier/personnel' },
  { label: 'Paramètres',      icon: 'Settings', path: '/immobilier/parametres' },
];
export const SIDEBAR_CONFIG = {
  IMMOBILIER: {
    label: 'Gestion Immobilière',
    icon: 'Home',
    couleur: '#14b8a6',
    description: 'Biens, locations, loyers et interventions',
    menus: SIDEBAR_MENUS,
  },
};
