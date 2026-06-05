export const DASHBOARD_WIDGETS = [
  { id: 'rdv_aujourdhui',  label: 'RDV aujourd\'hui', icon: '📅', color: '#ec4899', apiPath: '/salon/stats/rdv-aujourdhui' },
  { id: 'rdv_en_cours',    label: 'RDV en cours',     icon: '💇', color: '#f59e0b', apiPath: '/salon/stats/rdv-en-cours' },
  { id: 'ca_jour',         label: 'CA du jour',       icon: '💰', color: '#10b981', apiPath: '/salon/stats/ca-jour' },
  { id: 'clients_mois',    label: 'Clients du mois',  icon: '👤', color: '#3b82f6', apiPath: '/salon/stats/clients-mois' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',   label: 'Ventes (mois)',   type: 'bar',  apiPath: '/salon/stats/ventes-mois' },
  { id: 'ca_mensuel',    label: 'CA mensuel',      type: 'line', apiPath: '/salon/stats/ca-mensuel' },
  { id: 'prestations_rep', label: 'Prestations types', type: 'pie', apiPath: '/salon/stats/prestations-repartition' },
];
