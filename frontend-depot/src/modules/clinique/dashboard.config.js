export const DASHBOARD_WIDGETS = [
  { id: 'rdv_aujourd_hui',    label: 'RDV aujourd\'hui',    icon: '📅', color: '#0ea5e9', apiPath: '/clinique/stats/rdv-aujourdhui' },
  { id: 'consultations_jour', label: 'Consultations jour',  icon: '🩺', color: '#10b981', apiPath: '/clinique/stats/consultations-jour' },
  { id: 'patients_total',     label: 'Patients total',      icon: '👥', color: '#3b82f6', apiPath: '/clinique/stats/patients-total' },
  { id: 'caisse_jour',        label: 'Caisse du jour',      icon: '🏧', color: '#8b5cf6', apiPath: '/clinique/stats/caisse-jour' },
];

export const DASHBOARD_GRAPHS = [
  { id: 'consultations_mois', label: 'Consultations mois',  type: 'bar',  apiPath: '/clinique/stats/consultations-mois' },
  { id: 'motifs_consult',     label: 'Motifs fréquents',    type: 'pie',  apiPath: '/clinique/stats/motifs-consult' },
  { id: 'rdv_semaine',        label: 'RDV de la semaine',   type: 'line', apiPath: '/clinique/stats/rdv-semaine' },
];
