export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/elevage/dashboard' },
  { label: 'Troupeaux',       icon: 'Tractor', path: '/elevage/troupeaux' },
  { label: 'Événements',      icon: 'Clipboard', path: '/elevage/evenements' },
  { label: 'Alimentation',    icon: 'Wheat', path: '/elevage/alimentation' },
  { label: 'Santé',           icon: 'Syringe', path: '/elevage/sante' },
  { label: 'Reproduction',    icon: 'Dna', path: '/elevage/reproduction' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/elevage/ventes' },
  { label: 'Stock',           icon: 'Package', path: '/elevage/stock' },
  { label: 'Dépenses',        icon: 'TrendingUp', path: '/elevage/depenses' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/elevage/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/elevage/parametres' },
];

export const SIDEBAR_CONFIG = {
  ELEVAGE: {
    label: 'Élevage',
    icon: 'Tractor',
    couleur: '#65a30d',
    description: 'Gestion des troupeaux, alimentation et suivi vétérinaire',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/elevage/audit-patron' },
    ],
  },
};
