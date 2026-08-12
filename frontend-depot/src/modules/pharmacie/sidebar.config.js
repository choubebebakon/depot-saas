export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/pharmacie/dashboard' },
  { label: 'Médicaments',     icon: 'Pill', path: '/pharmacie/medicaments' },
  { label: 'Ordonnances',     icon: 'FileText', path: '/pharmacie/ordonnances' },
  { label: 'Alertes DLC',     icon: 'Clock', path: '/pharmacie/alertes-dlc', badge: '!' },
  { label: 'Stock',           icon: 'Package', path: '/pharmacie/stock' },
  { label: 'Lots',            icon: 'Hash', path: '/pharmacie/lots' },
  { label: 'Patients',        icon: 'Users', path: '/pharmacie/patients' },
  { label: 'Fournisseurs',    icon: 'Factory', path: '/pharmacie/fournisseurs' },
  { label: 'Ventes',          icon: 'DollarSign', path: '/pharmacie/ventes' },
  { label: 'Caisse',          icon: 'Wallet', path: '/pharmacie/caisse' },
  { label: 'Retours',         icon: 'RefreshCw', path: '/pharmacie/retours' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/pharmacie/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/pharmacie/parametres' },
];

export const SIDEBAR_CONFIG = {
  PHARMACIE: {
    label: 'Pharmacie',
    icon: 'Pill',
    couleur: '#059669',
    description: 'Gestion de pharmacie, médicaments, ordonnances et lots',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/pharmacie/audit-patron' },
    ],
  },
};
