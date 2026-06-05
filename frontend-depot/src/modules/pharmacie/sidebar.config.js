export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/pharmacie/dashboard' },
  { label: 'Médicaments',     icon: '💊', path: '/pharmacie/medicaments' },
  { label: 'Ordonnances',     icon: '📝', path: '/pharmacie/ordonnances' },
  { label: 'Alertes DLC',     icon: '⏰', path: '/pharmacie/alertes-dlc', badge: '!' },
  { label: 'Stock',           icon: '📦', path: '/pharmacie/stock' },
  { label: 'Lots',            icon: '🔢', path: '/pharmacie/lots' },
  { label: 'Patients',        icon: '👥', path: '/pharmacie/patients' },
  { label: 'Fournisseurs',    icon: '🏭', path: '/pharmacie/fournisseurs' },
  { label: 'Ventes',          icon: '💰', path: '/pharmacie/ventes' },
  { label: 'Caisse',          icon: '🏧', path: '/pharmacie/caisse' },
  { label: 'Retours',         icon: '🔄', path: '/pharmacie/retours' },
  { label: 'Rapports',        icon: '📈', path: '/pharmacie/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/pharmacie/parametres' },
];

export const SIDEBAR_CONFIG = {
  PHARMACIE: {
    label: 'Pharmacie',
    icon: '💊',
    couleur: '#059669',
    description: 'Gestion de pharmacie, médicaments, ordonnances et lots',
    menus: SIDEBAR_MENUS,
  },
};
