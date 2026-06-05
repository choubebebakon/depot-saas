export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/elevage/dashboard' },
  { label: 'Troupeaux',       icon: '🐄', path: '/elevage/troupeaux' },
  { label: 'Événements',      icon: '📋', path: '/elevage/evenements' },
  { label: 'Alimentation',    icon: '🌾', path: '/elevage/alimentation' },
  { label: 'Santé',           icon: '💉', path: '/elevage/sante' },
  { label: 'Reproduction',    icon: '🧬', path: '/elevage/reproduction' },
  { label: 'Ventes',          icon: '💰', path: '/elevage/ventes' },
  { label: 'Stock',           icon: '📦', path: '/elevage/stock' },
  { label: 'Dépenses',        icon: '💸', path: '/elevage/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/elevage/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/elevage/parametres' },
];

export const SIDEBAR_CONFIG = {
  ELEVAGE: {
    label: 'Élevage',
    icon: '🐄',
    couleur: '#65a30d',
    description: 'Gestion des troupeaux, alimentation et suivi vétérinaire',
    menus: SIDEBAR_MENUS,
  },
};
