export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/immobilier/dashboard' },
  { label: 'Biens',           icon: '🏠', path: '/immobilier/biens' },
  { label: 'Contrats',        icon: '📋', path: '/immobilier/contrats' },
  { label: 'Loyers',          icon: '💰', path: '/immobilier/loyers' },
  { label: 'Locataires',      icon: '👥', path: '/immobilier/locataires' },
  { label: 'Interventions',   icon: '🔧', path: '/immobilier/interventions' },
  { label: 'Dépenses',        icon: '💸', path: '/immobilier/depenses' },
  { label: 'Documents',       icon: '📄', path: '/immobilier/documents' },
  { label: 'Visites',         icon: '📅', path: '/immobilier/visites' },
  { label: 'Rapports',        icon: '📈', path: '/immobilier/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/immobilier/personnel' },
  { label: 'Paramètres',      icon: '⚙️', path: '/immobilier/parametres' },
];
export const SIDEBAR_CONFIG = {
  IMMOBILIER: {
    label: 'Gestion Immobilière',
    icon: '🏠',
    couleur: '#14b8a6',
    description: 'Biens, locations, loyers et interventions',
    menus: SIDEBAR_MENUS,
  },
};
