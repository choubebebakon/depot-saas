export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/clinique/dashboard' },
  { label: 'Médecins',        icon: '👨‍⚕️', path: '/clinique/medecins' },
  { label: 'Patients',        icon: '👥', path: '/clinique/patients' },
  { label: 'Consultations',   icon: '🩺', path: '/clinique/consultations' },
  { label: 'Prescriptions',   icon: '📝', path: '/clinique/prescriptions' },
  { label: 'Rendez-vous',     icon: '📅', path: '/clinique/rendez-vous' },
  { label: 'Médicaments',     icon: '💊', path: '/clinique/medicaments' },
  { label: 'Caisse',          icon: '🏧', path: '/clinique/caisse' },
  { label: 'Rapports',        icon: '📈', path: '/clinique/rapports' },
  { label: 'Paramètres',      icon: '⚙️', path: '/clinique/parametres' },
];

export const SIDEBAR_CONFIG = {
  CLINIQUE: {
    label: 'Clinique / Médical',
    icon: '🏥',
    couleur: '#0ea5e9',
    description: 'Dossiers patients, consultations et prescriptions',
    menus: SIDEBAR_MENUS,
  },
};
