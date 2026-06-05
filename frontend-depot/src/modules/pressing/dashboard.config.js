export const DASHBOARD_WIDGETS = [
  { id: 'tickets_en_cours', label: 'Tickets en cours', icon: '🏷️', color: '#7c3aed', apiPath: '/pressing/stats/tickets-en-cours' },
  { id: 'prets_retrait',    label: 'Prêts à retirer',  icon: '✅', color: '#10b981', apiPath: '/pressing/stats/prets-retrait' },
  { id: 'ca_jour',          label: 'CA du jour',       icon: '💰', color: '#f59e0b', apiPath: '/pressing/stats/ca-jour' },
  { id: 'clients_fideles',  label: 'Clients fidèles',  icon: '👤', color: '#3b82f6', apiPath: '/pressing/stats/clients-fideles' },
];
export const DASHBOARD_GRAPHS = [
  { id: 'ventes_mois',  label: 'Ventes (mois)',  type: 'bar',  apiPath: '/pressing/stats/ventes-mois' },
  { id: 'ca_mensuel',   label: 'CA mensuel',     type: 'line', apiPath: '/pressing/stats/ca-mensuel' },
  { id: 'services_rep', label: 'Services types', type: 'pie', apiPath: '/pressing/stats/services-repartition' },
];
