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
    icon:        'Package',
    couleur:     '#2563eb',
    description: 'Gestion de stock, livraisons, consignes et tournées',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/depot/dashboard' },
      { label: 'Stock',            icon: 'Package', path: '/depot/stock' },
      { label: 'Articles',         icon: 'Package', path: '/depot/articles' },
      { label: 'Consignes',        icon: 'RefreshCw', path: '/depot/consignes' },
      { label: 'Livraisons',       icon: 'Truck', path: '/depot/livraisons' },
      { label: 'Tournées',         icon: 'Car', path: '/depot/tournees' },
      { label: 'Clients',          icon: 'Users', path: '/depot/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/depot/fournisseurs' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/depot/ventes' },
      { label: 'Caisse',           icon: 'Wallet', path: '/depot/caisse' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depot/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/depot/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/depot/parametres' },
    ],
    widgets: [
      { id: 'ventes_jour',      label: 'Ventes du jour',       icon: 'DollarSign', color: '#10b981', apiPath: '/depot-boissons/stats/ventes-jour' },
      { id: 'stock_critique',   label: 'Stock critique',       icon: 'AlertTriangle',  color: '#f59e0b', apiPath: '/depot-boissons/stats/stock-critique' },
      { id: 'livraisons_cours', label: 'Livraisons en cours',  icon: 'Truck', color: '#3b82f6', apiPath: '/depot-boissons/stats/livraisons' },
      { id: 'caisse_jour',      label: 'Caisse du jour',       icon: 'Wallet', color: '#8b5cf6', apiPath: '/depot-boissons/stats/caisse-jour' },
      { id: 'clients_debiteurs',label: 'Clients débiteurs',    icon: 'Users', color: '#ef4444', apiPath: '/depot-boissons/stats/clients-debiteurs' },
      { id: 'tournees_actives', label: 'Tournées actives',     icon: 'Car', color: '#06b6d4', apiPath: '/depot-boissons/stats/tournees' },
    ],
  },

  // ── BOUTIQUE ──────────────────────────────────────────────────
  BOUTIQUE: {
    label:       'Boutique',
    icon:        'ShoppingBag',
    couleur:     '#0891b2',
    description: 'Ventes, caisse, stock et fidélité client',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Promotions',       icon: 'Tag',  path: '/promotions' },
      { label: 'Factures',         icon: 'Receipt', path: '/factures' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
    widgets: [
      { id: 'ventes_jour',    label: 'Ventes du jour',      icon: 'DollarSign', color: '#10b981', apiPath: '/stats/ventes-jour' },
      { id: 'stock_critique', label: 'Ruptures de stock',   icon: 'AlertTriangle',  color: '#f59e0b', apiPath: '/stats/stock-critique' },
      { id: 'clients_actifs', label: 'Clients actifs',      icon: 'Users', color: '#3b82f6', apiPath: '/stats/clients-actifs' },
      { id: 'caisse_jour',    label: 'Caisse du jour',      icon: 'Wallet', color: '#8b5cf6', apiPath: '/stats/caisse-jour' },
    ],
  },

  // ── QUINCAILLERIE ─────────────────────────────────────────────
  QUINCAILLERIE: {
    label:       'Quincaillerie / BTP',
    icon:        'Wrench',
    couleur:     '#b45309',
    description: 'Stock, devis, chantiers et livraisons',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Produits',         icon: 'Wrench', path: '/produits' },
      { label: 'Catégories',       icon: 'FolderOpen', path: '/categories' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Chantiers',        icon: 'HardHat',  path: '/chantiers' },
      { label: 'Devis',            icon: 'Clipboard', path: '/devis' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },

  // ── PHARMACIE ─────────────────────────────────────────────────
  PHARMACIE: {
    label:       'Pharmacie',
    icon:        'Pill',
    couleur:     '#059669',
    description: 'Médicaments, ordonnances et gestion des lots',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Médicaments',      icon: 'Syringe', path: '/medicaments' },
      { label: 'Ordonnances',      icon: 'Clipboard', path: '/ordonnances' },
      { label: 'Alertes DLC',      icon: 'Clock', path: '/alertes-dlc', badge: 'AlertTriangle' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Lots',             icon: 'Hash', path: '/lots' },
      { label: 'Patients',         icon: 'Users', path: '/patients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Retours',          icon: 'RefreshCw', path: '/retours' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },

  // ── RESTAURANT ────────────────────────────────────────────────
  RESTAURANT: {
    label:       'Restaurant',
    icon:        'Utensils',
    couleur:     '#dc2626',
    description: 'Tables, commandes, cuisine et réservations',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Tables',           icon: 'Utensils️',  path: '/tables' },
      { label: 'Commandes',        icon: 'Clipboard', path: '/commandes' },
      { label: 'Menu',             icon: 'BookOpen', path: '/menu' },
      { label: 'Cuisine',          icon: 'ChefHat', path: '/cuisine' },
      { label: 'Réservations',     icon: 'Calendar', path: '/reservations' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Stock cuisine',    icon: 'Package', path: '/stock' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
    widgets: [
      { id: 'tables_occupees',    label: 'Tables occupées',       icon: 'Utensils️',  color: '#dc2626', apiPath: '/stats/tables-occupees' },
      { id: 'commandes_encours',  label: 'Commandes en cours',    icon: 'Clipboard', color: '#f59e0b', apiPath: '/stats/commandes-cours' },
      { id: 'recettes_jour',      label: 'Recettes du jour',      icon: 'DollarSign', color: '#10b981', apiPath: '/stats/recettes-jour' },
      { id: 'reservations_jour',  label: 'Réservations du jour',  icon: 'Calendar', color: '#3b82f6', apiPath: '/stats/reservations-jour' },
    ],
  },

  // ── TELEPHONIE ────────────────────────────────────────────────
  TELEPHONIE: {
    label:       'Téléphonie',
    icon:        'Smartphone',
    couleur:     '#7c3aed',
    description: 'Ventes, réparations, IMEI et garanties',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Téléphones',       icon: 'Smartphone', path: '/telephones' },
      { label: 'Accessoires',      icon: 'Headphones', path: '/accessoires' },
      { label: 'Réparations',      icon: 'Wrench', path: '/reparations' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Recharges',        icon: 'Battery', path: '/recharges' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },

  // ── SUPERMARCHE ───────────────────────────────────────────────
  SUPERMARCHE: {
    label:       'Supermarché',
    icon:        'ShoppingCart',
    couleur:     '#f59e0b',
    description: 'Gestion de stock, rayons, scan code-barres et ventes',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'POS / Caisse',     icon: 'ShoppingCart', path: '/pos' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Rayons',           icon: 'ShoppingBag', path: '/rayons' },
      { label: 'Promotions',       icon: 'Tag',  path: '/promotions' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Réceptions',       icon: 'Package', path: '/receptions' },
      { label: 'Inventaire',       icon: 'BarChart3', path: '/inventaire' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── CIMENT / BTP ──────────────────────────────────────────────
  CIMENT_BTP: {
    label:       'Ciment / BTP',
    icon:        'HardHat',
    couleur:     '#b45309',
    description: 'Gestion des livraisons, véhicules et chantiers',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Devis',            icon: 'Clipboard', path: '/devis' },
      { label: 'Chantiers',        icon: 'HardHat',  path: '/chantiers' },
      { label: 'Livraisons',       icon: 'Truck', path: '/livraisons' },
      { label: 'Véhicules',        icon: 'Truck', path: '/vehicules' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── PRESSING ──────────────────────────────────────────────────
  PRESSING: {
    label:       'Pressing',
    icon:        'Shirt',
    couleur:     '#7c3aed',
    description: 'Gestion des dépôts, lavages et retraits',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Tickets',          icon: 'Tag',  path: '/tickets' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Services',         icon: 'Shirt', path: '/services' },
      { label: 'Commandes',        icon: 'Clipboard', path: '/commandes' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Calendrier',       icon: 'Calendar', path: '/calendrier' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── GARAGE AUTOMOBILE ──────────────────────────────────────────
  GARAGE_AUTOMOBILE: {
    label:       'Garage Automobile',
    icon:        'Wrench',
    couleur:     '#e11d48',
    description: 'Ordres de réparation, parc véhicules et pièces',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Véhicules',        icon: '🚗', path: '/vehicules' },
      { label: 'Ordres de réparation', icon: 'Wrench', path: '/ordres' },
      { label: 'Devis',            icon: 'FileText', path: '/devis' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Pièces stock',     icon: 'Cog',  path: '/pieces' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Caisse',           icon: 'DollarSign', path: '/caisse' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── ELEVAGE ────────────────────────────────────────────────────
  ELEVAGE: {
    label:       'Élevage',
    icon:        'Tractor',
    couleur:     '#65a30d',
    description: 'Gestion des troupeaux, alimentation et suivi vétérinaire',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Troupeaux',        icon: 'Tractor', path: '/troupeaux' },
      { label: 'Événements',       icon: 'Clipboard', path: '/evenements' },
      { label: 'Alimentation',     icon: 'Wheat', path: '/alimentation' },
      { label: 'Santé',            icon: 'Hospital', path: '/sante' },
      { label: 'Reproduction',     icon: 'Dna', path: '/reproduction' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── SALON DE COIFFURE / BEAUTE ────────────────────────────────
  SALON_BEAUTE: {
    label:       'Salon de Coiffure / Beauté',
    icon:        'Scissors',
    couleur:     '#ec4899',
    description: 'Rendez-vous, prestations et gestion clientèle',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Rendez-vous',      icon: 'Clipboard', path: '/rendez-vous' },
      { label: 'Agenda',           icon: 'Calendar', path: '/agenda' },
      { label: 'Prestations',      icon: 'Scissors', path: '/prestations' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Stock produits',   icon: 'SprayCan', path: '/stock' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Fidélité',         icon: 'Gift', path: '/abonnements' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── PARFUMERIE / COSMETIQUE ────────────────────────────────────
  PARFUMERIE: {
    label:       'Parfumerie / Cosmétique',
    icon:        'SprayCan',
    couleur:     '#d946ef',
    description: 'Ventes, fidélité et catalogue produits',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Produits',         icon: 'SprayCan', path: '/produits' },
      { label: 'Catégories',       icon: 'FolderOpen', path: '/categories' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Fidélité',         icon: 'Gift', path: '/fidelite' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── BOULANGERIE / PATISSERIE ───────────────────────────────────
  BOULANGERIE: {
    label:       'Boulangerie / Pâtisserie',
    icon:        'Cookie',
    couleur:     '#d97706',
    description: 'Production du jour, recettes et ventes',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Production',       icon: 'Cookie', path: '/production' },
      { label: 'Recettes',         icon: 'Clipboard', path: '/recettes' },
      { label: 'Produits',         icon: 'Cookie', path: '/produits' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── GLACIER / SNACK ───────────────────────────────────────────
  GLACIER_SNACK: {
    label:       'Glacier / Snack',
    icon:        'IceCream',
    couleur:     '#06b6d4',
    description: 'Compositions, commandes rapides et caisse',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Commandes',        icon: 'Clipboard', path: '/commandes' },
      { label: 'Menu',             icon: 'BookOpen', path: '/menu' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── LIBRAIRIE / PAPETERIE ──────────────────────────────────────
  LIBRAIRIE: {
    label:       'Librairie / Papeterie',
    icon:        'Library',
    couleur:     '#6366f1',
    description: 'Catalogue livres, papeterie et commandes spéciales',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Catalogue',        icon: 'Library', path: '/catalogue' },
      { label: 'Ventes',           icon: 'DollarSign', path: '/ventes' },
      { label: 'Commandes spé.',   icon: 'Clipboard', path: '/commandes' },
      { label: 'Stock',            icon: 'Package', path: '/stock' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
    widgets: [
      { id: 'ventes_jour',        label: 'Ventes du jour',        icon: 'DollarSign', color: '#10b981', apiPath: '/stats/ventes-jour' },
      { id: 'commandes_attente',  label: 'Commandes en attente',  icon: 'Clipboard', color: '#f59e0b', apiPath: '/librairie/stats' },
      { id: 'stock_critique',     label: 'Stock critique',       icon: 'AlertTriangle',  color: '#ef4444', apiPath: '/stats/stock-critique' },
      { id: 'caisse_jour',        label: 'Caisse du jour',        icon: 'Wallet', color: '#6366f1', apiPath: '/stats/caisse-jour' },
    ],
  },
  // ── CLINIQUE ───────────────────────────────────────────────────
  CLINIQUE: {
    label:       'Clinique / Médical',
    icon:        'Hospital',
    couleur:     '#0ea5e9',
    description: 'Dossiers patients, consultations et prescriptions',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Médecins',         icon: 'User', path: '/medecins' },
      { label: 'Patients',         icon: 'Users', path: '/patients' },
      { label: 'Consultations',    icon: 'Stethoscope', path: '/consultations' },
      { label: 'Prescriptions',    icon: 'Clipboard', path: '/prescriptions' },
      { label: 'Rendez-vous',      icon: 'Calendar', path: '/rendez-vous' },
      { label: 'Médicaments',      icon: 'Pill', path: '/medicaments' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── TRANSPORT / LOGISTIQUE ─────────────────────────────────────
  TRANSPORT: {
    label:       'Transport / Logistique',
    icon:        'Truck',
    couleur:     '#f97316',
    description: 'Suivi colis, flotte véhicules et trajets',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Colis',            icon: 'Package', path: '/colis' },
      { label: 'Trajets',          icon: 'Truck', path: '/trajets' },
      { label: 'Flotte',           icon: 'Truck', path: '/flotte' },
      { label: 'Chauffeurs',       icon: 'User', path: '/chauffeurs' },
      { label: 'Livraisons',       icon: 'Mail', path: '/livraisons' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Caisse',           icon: 'Wallet', path: '/caisse' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── GESTION IMMOBILIERE ───────────────────────────────────────
  IMMOBILIER: {
    label:       'Gestion Immobilière',
    icon:        'Home',
    couleur:     '#14b8a6',
    description: 'Biens, locations, loyers et interventions',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Biens',            icon: 'Home', path: '/biens' },
      { label: 'Contrats',         icon: 'Clipboard', path: '/contrats' },
      { label: 'Loyers',           icon: 'DollarSign', path: '/loyers' },
      { label: 'Locataires',       icon: 'Users', path: '/locataires' },
      { label: 'Interventions',    icon: 'Wrench', path: '/interventions' },
      { label: 'Dépenses',         icon: 'TrendingUp', path: '/depenses' },
      { label: 'Documents',        icon: 'FileText', path: '/documents' },
      { label: 'Visites',          icon: 'Eye',  path: '/visites' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
    ],
  },
  // ── HOTEL ──────────────────────────────────────────────────────
  HOTEL: {
    label:       'Hôtel',
    icon:        'Hotel',
    couleur:     '#8b5cf6',
    description: 'Chambres, réservations et consommations',
    menus: [
      { label: 'Tableau de bord',  icon: 'BarChart3', path: '/dashboard' },
      { label: 'Chambres',         icon: 'Bed',  path: '/chambres' },
      { label: 'Réservations',     icon: 'Calendar', path: '/reservations' },
      { label: 'Clients',          icon: 'Users', path: '/clients' },
      { label: 'Facturation',      icon: 'Receipt', path: '/facturation' },
      { label: 'Personnel',        icon: 'Users', path: '/personnel' },
      { label: 'Ménage',           icon: 'Broom', path: '/menage' },
      { label: 'Services',         icon: 'Bell',  path: '/services' },
      { label: 'Fournisseurs',     icon: 'Factory', path: '/fournisseurs' },
      { label: 'Rapports',         icon: 'TrendingUp', path: '/rapports' },
      { label: 'Paramètres',       icon: 'Cog', path: '/parametres' },
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