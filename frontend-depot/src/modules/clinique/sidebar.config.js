export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: 'BarChart3', path: '/clinique/dashboard' },
  { label: 'Médecins',        icon: 'User', path: '/clinique/medecins' },
  { label: 'Patients',        icon: 'Users', path: '/clinique/patients' },
  { label: 'Consultations',   icon: 'Stethoscope', path: '/clinique/consultations' },
  { label: 'Prescriptions',   icon: 'FileText', path: '/clinique/prescriptions' },
  { label: 'Rendez-vous',     icon: 'Calendar', path: '/clinique/rendez-vous' },
  { label: 'Médicaments',     icon: 'Pill', path: '/clinique/medicaments' },
  { label: 'Caisse',          icon: 'Wallet', path: '/clinique/caisse' },
  { label: 'Rapports',        icon: 'TrendingUp', path: '/clinique/rapports' },
  { label: 'Paramètres',      icon: 'Settings', path: '/clinique/parametres' },
];

export const SIDEBAR_CONFIG = {
  CLINIQUE: {
    label: 'Clinique / Médical',
    icon: 'Hospital',
    couleur: '#0ea5e9',
    description: 'Dossiers patients, consultations et prescriptions',
    menus: SIDEBAR_MENUS,
    ADMINISTRATION_MENUS: [
      { label: 'Audit Patron', icon: 'Shield', path: '/clinique/audit-patron' },
    ],
  },
};
