// ─────────────────────────────────────────────────────────────────
// metier-dashboard.config.ts  (Frontend)
// Définit la navigation et les widgets du dashboard
// pour chaque métier. Utilisé par useMetier() et le Sidebar.
// ─────────────────────────────────────────────────────────────────

export type MetierType =
  | 'DEPOT_BOISSONS'
  | 'BOUTIQUE'
  | 'QUINCAILLERIE'
  | 'PHARMACIE'
  | 'RESTAURANT'
  | 'TELEPHONIE'
  | 'SUPERMARCHE'
  | 'CIMENT_BTP'
  | 'PRESSING'
  | 'GARAGE_AUTOMOBILE'
  | 'ELEVAGE'
  | 'SALON_BEAUTE'
  | 'PARFUMERIE'
  | 'BOULANGERIE'
  | 'GLACIER_SNACK'
  | 'LIBRAIRIE'
  | 'CLINIQUE'
  | 'TRANSPORT'
  | 'IMMOBILIER'
  | 'HOTEL';

export interface MenuItem {
  label:      string;
  icon:       string;
  path:       string;
  badge?:     string;       // Ex: "NOUVEAU", nombre d'alertes
  children?:  MenuItem[];   // Sous-menus
}

export interface DashboardWidget {
  id:      string;
  label:   string;
  icon:    string;
  color:   string;          // Couleur de la carte widget
  apiPath: string;          // Endpoint pour charger la valeur
}

export interface MetierDashboardConfig {
  label:       string;       // Nom lisible du métier
  icon:        string;       // Emoji du métier
  couleur:     string;       // Couleur principale du thème
  description: string;       // Description courte
  menus:       MenuItem[];
  widgets:     DashboardWidget[];
}

export const METIER_DASHBOARD: Record<MetierType, MetierDashboardConfig> = {

  // ── DEPOT BOISSONS ────────────────────────────────────────────
  DEPOT_BOISSONS: {
    label:       'Dépôt de Boissons',
    icon:        '🥤',
    couleur:     '#2563eb',
    description: 'Gestion de stock, livraisons, consignes et tournées',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/depot/dashboard' },
      { label: 'Stock',            icon: '📦', path: '/depot/stock' },
      { label: 'Articles',         icon: '🥤', path: '/depot/articles' },
      { label: 'Consignes',        icon: '🔄', path: '/depot/consignes' },
      { label: 'Livraisons',       icon: '🚚', path: '/depot/livraisons' },
      { label: 'Tournées',         icon: '🛺', path: '/depot/tournees' },
      { label: 'Clients',          icon: '👥', path: '/depot/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/depot/fournisseurs' },
      { label: 'Ventes',           icon: '💰', path: '/depot/ventes' },
      { label: 'Caisse',           icon: '🏧', path: '/depot/caisse' },
      { label: 'Dépenses',         icon: '💸', path: '/depot/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/depot/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/depot/parametres' },
    ],
    widgets: [
      { id: 'ventes_jour',      label: 'Ventes du jour',       icon: '💰', color: '#10b981', apiPath: '/depot-boissons/stats/ventes-jour' },
      { id: 'stock_critique',   label: 'Stock critique',       icon: '⚠️',  color: '#f59e0b', apiPath: '/depot-boissons/stats/stock-critique' },
      { id: 'livraisons_cours', label: 'Livraisons en cours',  icon: '🚚', color: '#3b82f6', apiPath: '/depot-boissons/stats/livraisons' },
      { id: 'caisse_jour',      label: 'Caisse du jour',       icon: '🏧', color: '#8b5cf6', apiPath: '/depot-boissons/stats/caisse-jour' },
      { id: 'clients_debiteurs',label: 'Clients débiteurs',    icon: '👥', color: '#ef4444', apiPath: '/depot-boissons/stats/clients-debiteurs' },
      { id: 'tournees_actives', label: 'Tournées actives',     icon: '🛺', color: '#06b6d4', apiPath: '/depot-boissons/stats/tournees' },
    ],
  },

  // ── BOUTIQUE ──────────────────────────────────────────────────
  BOUTIQUE: {
    label:       'Boutique',
    icon:        '🏪',
    couleur:     '#0891b2',
    description: 'Ventes, caisse, stock et fidélité client',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Promotions',       icon: '🏷️',  path: '/promotions' },
      { label: 'Factures',         icon: '🧾', path: '/factures' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
    widgets: [
      { id: 'ventes_jour',    label: 'Ventes du jour',      icon: '💰', color: '#10b981', apiPath: '/stats/ventes-jour' },
      { id: 'stock_critique', label: 'Ruptures de stock',   icon: '⚠️',  color: '#f59e0b', apiPath: '/stats/stock-critique' },
      { id: 'clients_actifs', label: 'Clients actifs',      icon: '👥', color: '#3b82f6', apiPath: '/stats/clients-actifs' },
      { id: 'caisse_jour',    label: 'Caisse du jour',      icon: '🏧', color: '#8b5cf6', apiPath: '/stats/caisse-jour' },
    ],
  },

  // ── QUINCAILLERIE ─────────────────────────────────────────────
  QUINCAILLERIE: {
    label:       'Quincaillerie / BTP',
    icon:        '🛠',
    couleur:     '#b45309',
    description: 'Stock, devis, chantiers et livraisons',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Produits',         icon: '🛠', path: '/produits' },
      { label: 'Catégories',       icon: '📁', path: '/categories' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Chantiers',        icon: '🏗️',  path: '/chantiers' },
      { label: 'Devis',            icon: '📋', path: '/devis' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },

  // ── PHARMACIE ─────────────────────────────────────────────────
  PHARMACIE: {
    label:       'Pharmacie',
    icon:        '💊',
    couleur:     '#059669',
    description: 'Médicaments, ordonnances et gestion des lots',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Médicaments',      icon: '💉', path: '/medicaments' },
      { label: 'Ordonnances',      icon: '📝', path: '/ordonnances' },
      { label: 'Alertes DLC',      icon: '⏰', path: '/alertes-dlc', badge: '!' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Lots',             icon: '🔢', path: '/lots' },
      { label: 'Patients',         icon: '👥', path: '/patients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Retours',          icon: '🔄', path: '/retours' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },

  // ── RESTAURANT ────────────────────────────────────────────────
  RESTAURANT: {
    label:       'Restaurant',
    icon:        '🍽',
    couleur:     '#dc2626',
    description: 'Tables, commandes, cuisine et réservations',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Tables',           icon: '🍽️',  path: '/tables' },
      { label: 'Commandes',        icon: '📋', path: '/commandes' },
      { label: 'Menu',             icon: '📖', path: '/menu' },
      { label: 'Cuisine',          icon: '👨‍🍳', path: '/cuisine' },
      { label: 'Réservations',     icon: '📅', path: '/reservations' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Stock cuisine',    icon: '📦', path: '/stock' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
    widgets: [
      { id: 'tables_occupees',    label: 'Tables occupées',       icon: '🍽️',  color: '#dc2626', apiPath: '/stats/tables-occupees' },
      { id: 'commandes_encours',  label: 'Commandes en cours',    icon: '📋', color: '#f59e0b', apiPath: '/stats/commandes-cours' },
      { id: 'recettes_jour',      label: 'Recettes du jour',      icon: '💰', color: '#10b981', apiPath: '/stats/recettes-jour' },
      { id: 'reservations_jour',  label: 'Réservations du jour',  icon: '📅', color: '#3b82f6', apiPath: '/stats/reservations-jour' },
    ],
  },

  // ── TELEPHONIE ────────────────────────────────────────────────
  TELEPHONIE: {
    label:       'Téléphonie',
    icon:        '📱',
    couleur:     '#7c3aed',
    description: 'Ventes, réparations, IMEI et garanties',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Téléphones',       icon: '📱', path: '/telephones' },
      { label: 'Accessoires',      icon: '🎧', path: '/accessoires' },
      { label: 'Réparations',      icon: '🔧', path: '/reparations' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Recharges',        icon: '🔋', path: '/recharges' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },

  // ── SUPERMARCHE ───────────────────────────────────────────────
  SUPERMARCHE: {
    label:       'Supermarché',
    icon:        '🛒',
    couleur:     '#f59e0b',
    description: 'Gestion de stock, rayons, scan code-barres et ventes',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'POS / Caisse',     icon: '🛒', path: '/pos' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Rayons',           icon: '🏪', path: '/rayons' },
      { label: 'Promotions',       icon: '🏷️',  path: '/promotions' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Réceptions',       icon: '📦', path: '/receptions' },
      { label: 'Inventaire',       icon: '📊', path: '/inventaire' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── CIMENT / BTP ──────────────────────────────────────────────
  CIMENT_BTP: {
    label:       'Ciment / BTP',
    icon:        '🏗️',
    couleur:     '#b45309',
    description: 'Gestion des livraisons, véhicules et chantiers',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Devis',            icon: '📋', path: '/devis' },
      { label: 'Chantiers',        icon: '🏗️',  path: '/chantiers' },
      { label: 'Livraisons',       icon: '🚚', path: '/livraisons' },
      { label: 'Véhicules',        icon: '🚛', path: '/vehicules' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── PRESSING ──────────────────────────────────────────────────
  PRESSING: {
    label:       'Pressing',
    icon:        '👔',
    couleur:     '#7c3aed',
    description: 'Gestion des dépôts, lavages et retraits',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Tickets',          icon: '🏷️',  path: '/tickets' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Services',         icon: '👔', path: '/services' },
      { label: 'Commandes',        icon: '📋', path: '/commandes' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Calendrier',       icon: '📅', path: '/calendrier' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── GARAGE AUTOMOBILE ──────────────────────────────────────────
  GARAGE_AUTOMOBILE: {
    label:       'Garage Automobile',
    icon:        '🔧',
    couleur:     '#e11d48',
    description: 'Ordres de réparation, parc véhicules et pièces',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Véhicules',        icon: '🚗', path: '/vehicules' },
      { label: 'Ordres de réparation', icon: '🔧', path: '/ordres' },
      { label: 'Devis',            icon: '📄', path: '/devis' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Pièces stock',     icon: '⚙️',  path: '/pieces' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Caisse',           icon: '💰', path: '/caisse' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── ELEVAGE ────────────────────────────────────────────────────
  ELEVAGE: {
    label:       'Élevage',
    icon:        '🐄',
    couleur:     '#65a30d',
    description: 'Gestion des troupeaux, alimentation et suivi vétérinaire',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Troupeaux',        icon: '🐄', path: '/troupeaux' },
      { label: 'Événements',       icon: '📋', path: '/evenements' },
      { label: 'Alimentation',     icon: '🌾', path: '/alimentation' },
      { label: 'Santé',            icon: '🏥', path: '/sante' },
      { label: 'Reproduction',     icon: '🧬', path: '/reproduction' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── SALON DE COIFFURE / BEAUTE ────────────────────────────────
  SALON_BEAUTE: {
    label:       'Salon de Coiffure / Beauté',
    icon:        '💇',
    couleur:     '#ec4899',
    description: 'Rendez-vous, prestations et gestion clientèle',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Rendez-vous',      icon: '📋', path: '/rendez-vous' },
      { label: 'Agenda',           icon: '📅', path: '/agenda' },
      { label: 'Prestations',      icon: '💇', path: '/prestations' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Stock produits',   icon: '🧴', path: '/stock' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Fidélité',         icon: '🎁', path: '/abonnements' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── PARFUMERIE / COSMETIQUE ────────────────────────────────────
  PARFUMERIE: {
    label:       'Parfumerie / Cosmétique',
    icon:        '🧴',
    couleur:     '#d946ef',
    description: 'Ventes, fidélité et catalogue produits',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Produits',         icon: '🧴', path: '/produits' },
      { label: 'Catégories',       icon: '📁', path: '/categories' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Fidélité',         icon: '🎁', path: '/fidelite' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── BOULANGERIE / PATISSERIE ───────────────────────────────────
  BOULANGERIE: {
    label:       'Boulangerie / Pâtisserie',
    icon:        '🥖',
    couleur:     '#d97706',
    description: 'Production du jour, recettes et ventes',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Production',       icon: '🥖', path: '/production' },
      { label: 'Recettes',         icon: '📝', path: '/recettes' },
      { label: 'Produits',         icon: '🍞', path: '/produits' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── GLACIER / SNACK ───────────────────────────────────────────
  GLACIER_SNACK: {
    label:       'Glacier / Snack',
    icon:        '🍦',
    couleur:     '#06b6d4',
    description: 'Compositions, commandes rapides et caisse',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Commandes',        icon: '📋', path: '/commandes' },
      { label: 'Menu',             icon: '📖', path: '/menu' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── LIBRAIRIE / PAPETERIE ──────────────────────────────────────
  LIBRAIRIE: {
    label:       'Librairie / Papeterie',
    icon:        '📚',
    couleur:     '#6366f1',
    description: 'Catalogue livres, papeterie et commandes spéciales',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Catalogue',        icon: '📚', path: '/catalogue' },
      { label: 'Ventes',           icon: '💰', path: '/ventes' },
      { label: 'Commandes spé.',   icon: '📋', path: '/commandes' },
      { label: 'Stock',            icon: '📦', path: '/stock' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
    widgets: [
      { id: 'ventes_jour',        label: 'Ventes du jour',        icon: '💰', color: '#10b981', apiPath: '/stats/ventes-jour' },
      { id: 'commandes_attente',  label: 'Commandes en attente',  icon: '📋', color: '#f59e0b', apiPath: '/librairie/stats' },
      { id: 'stock_critique',     label: 'Stock critique',       icon: '⚠️',  color: '#ef4444', apiPath: '/stats/stock-critique' },
      { id: 'caisse_jour',        label: 'Caisse du jour',        icon: '🏧', color: '#6366f1', apiPath: '/stats/caisse-jour' },
    ],
  },
  // ── CLINIQUE ───────────────────────────────────────────────────
  CLINIQUE: {
    label:       'Clinique / Médical',
    icon:        '🏥',
    couleur:     '#0ea5e9',
    description: 'Dossiers patients, consultations et prescriptions',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Médecins',         icon: '👨‍⚕️', path: '/medecins' },
      { label: 'Patients',         icon: '👥', path: '/patients' },
      { label: 'Consultations',    icon: '🩺', path: '/consultations' },
      { label: 'Prescriptions',    icon: '📝', path: '/prescriptions' },
      { label: 'Rendez-vous',      icon: '📅', path: '/rendez-vous' },
      { label: 'Médicaments',      icon: '💊', path: '/medicaments' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── TRANSPORT / LOGISTIQUE ─────────────────────────────────────
  TRANSPORT: {
    label:       'Transport / Logistique',
    icon:        '🚛',
    couleur:     '#f97316',
    description: 'Suivi colis, flotte véhicules et trajets',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Colis',            icon: '📦', path: '/colis' },
      { label: 'Trajets',          icon: '🚛', path: '/trajets' },
      { label: 'Flotte',           icon: '🚚', path: '/flotte' },
      { label: 'Chauffeurs',       icon: '🧑‍✈️', path: '/chauffeurs' },
      { label: 'Livraisons',       icon: '📬', path: '/livraisons' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Caisse',           icon: '🏧', path: '/caisse' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── GESTION IMMOBILIERE ───────────────────────────────────────
  IMMOBILIER: {
    label:       'Gestion Immobilière',
    icon:        '🏠',
    couleur:     '#14b8a6',
    description: 'Biens, locations, loyers et interventions',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Biens',            icon: '🏠', path: '/biens' },
      { label: 'Contrats',         icon: '📋', path: '/contrats' },
      { label: 'Loyers',           icon: '💰', path: '/loyers' },
      { label: 'Locataires',       icon: '👥', path: '/locataires' },
      { label: 'Interventions',    icon: '🔧', path: '/interventions' },
      { label: 'Dépenses',         icon: '💸', path: '/depenses' },
      { label: 'Documents',        icon: '📄', path: '/documents' },
      { label: 'Visites',          icon: '👁️',  path: '/visites' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
  // ── HOTEL ──────────────────────────────────────────────────────
  HOTEL: {
    label:       'Hôtel',
    icon:        '🏨',
    couleur:     '#8b5cf6',
    description: 'Chambres, réservations et consommations',
    menus: [
      { label: 'Tableau de bord',  icon: '📊', path: '/dashboard' },
      { label: 'Chambres',         icon: '🛏️',  path: '/chambres' },
      { label: 'Réservations',     icon: '📅', path: '/reservations' },
      { label: 'Clients',          icon: '👥', path: '/clients' },
      { label: 'Facturation',      icon: '🧾', path: '/facturation' },
      { label: 'Personnel',        icon: '👥', path: '/personnel' },
      { label: 'Ménage',           icon: '🧹', path: '/menage' },
      { label: 'Services',         icon: '🛎️',  path: '/services' },
      { label: 'Fournisseurs',     icon: '🏭', path: '/fournisseurs' },
      { label: 'Rapports',         icon: '📈', path: '/rapports' },
      { label: 'Paramètres',       icon: '⚙️', path: '/parametres' },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────

// Récupère la config complète d'un métier
export function getMetierConfig(metier: MetierType): MetierDashboardConfig {
  return METIER_DASHBOARD[metier];
}

// Récupère uniquement les menus d'un métier
export function getMetierMenus(metier: MetierType): MenuItem[] {
  return METIER_DASHBOARD[metier]?.menus ?? [];
}

// Récupère uniquement les widgets d'un métier
export function getMetierWidgets(metier: MetierType): DashboardWidget[] {
  return METIER_DASHBOARD[metier]?.widgets ?? [];
}

// Liste tous les métiers disponibles pour la page onboarding
export function getAllMetiers(): Array<{ type: MetierType } & MetierDashboardConfig> {
  return Object.entries(METIER_DASHBOARD).map(([type, config]) => ({
    type: type as MetierType,
    ...config,
  }));
}