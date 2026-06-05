export const SIDEBAR_MENUS = [
  { label: 'Tableau de bord', icon: '📊', path: '/pressing/dashboard' },
  { label: 'Tickets dépôts',  icon: '🏷️', path: '/pressing/tickets' },
  { label: 'Clients',         icon: '👤', path: '/pressing/clients' },
  { label: 'Services',        icon: '🧼', path: '/pressing/services' },
  { label: 'Commandes',       icon: '📋', path: '/pressing/commandes' },
  { label: 'Stock',           icon: '📦', path: '/pressing/stock' },
  { label: 'Ventes',          icon: '💰', path: '/pressing/ventes' },
  { label: 'Dépenses',        icon: '💸', path: '/pressing/depenses' },
  { label: 'Rapports',        icon: '📈', path: '/pressing/rapports' },
  { label: 'Personnel',       icon: '👥', path: '/pressing/personnel' },
  { label: 'Calendrier',      icon: '📅', path: '/pressing/calendrier' },
  { label: 'Paramètres',      icon: '⚙️', path: '/pressing/parametres' },
];
export const SIDEBAR_CONFIG = {
  PRESSING: {
    label: 'Pressing',
    icon: '👔',
    couleur: '#7c3aed',
    description: 'Gestion des dépôts, lavages, retraits et services',
    menus: SIDEBAR_MENUS,
  },
};
