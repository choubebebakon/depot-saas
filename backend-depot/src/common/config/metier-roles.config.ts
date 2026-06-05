// ─────────────────────────────────────────────────────────────────
// metier-roles.config.ts
// Mappe chaque métier à ses rôles et permissions spécifiques.
// DEPOT_BOISSONS est exclu — déjà en production.
// ─────────────────────────────────────────────────────────────────

export enum MetierType {
  DEPOT_BOISSONS = 'DEPOT_BOISSONS', // Existant — ne pas recréer
  BOUTIQUE       = 'BOUTIQUE',
  QUINCAILLERIE  = 'QUINCAILLERIE',
  PHARMACIE      = 'PHARMACIE',
  RESTAURANT     = 'RESTAURANT',
  TELEPHONIE     = 'TELEPHONIE',
  SUPERMARCHE    = 'SUPERMARCHE',
  CIMENT_BTP     = 'CIMENT_BTP',
  PRESSING       = 'PRESSING',
  GARAGE_AUTOMOBILE = 'GARAGE_AUTOMOBILE',
  ELEVAGE        = 'ELEVAGE',
  SALON_BEAUTE   = 'SALON_BEAUTE',
  PARFUMERIE     = 'PARFUMERIE',
  BOULANGERIE    = 'BOULANGERIE',
  GLACIER_SNACK  = 'GLACIER_SNACK',
  LIBRAIRIE      = 'LIBRAIRIE',
  CLINIQUE       = 'CLINIQUE',
  TRANSPORT      = 'TRANSPORT',
  IMMOBILIER     = 'IMMOBILIER',
  HOTEL          = 'HOTEL',
}

export interface RoleConfig {
  nom:         string;
  label:       string;        // Nom lisible pour l'UI
  permissions: Permission[];
  isAdmin:     boolean;       // Ce rôle reçoit l'accès complet
}

export type Permission =
  // Stock
  | 'STOCK_READ'
  | 'STOCK_WRITE'
  | 'STOCK_DELETE'
  // Ventes
  | 'VENTES_READ'
  | 'VENTES_WRITE'
  | 'VENTES_DELETE'
  // Caisse
  | 'CAISSE_READ'
  | 'CAISSE_WRITE'
  | 'CAISSE_OPEN_CLOSE'
  // Clients
  | 'CLIENTS_READ'
  | 'CLIENTS_WRITE'
  // Factures
  | 'FACTURES_READ'
  | 'FACTURES_WRITE'
  | 'FACTURES_EXPORT'
  // Fournisseurs
  | 'FOURNISSEURS_READ'
  | 'FOURNISSEURS_WRITE'
  // Rapports
  | 'RAPPORTS_READ'
  | 'RAPPORTS_EXPORT'
  // Dépenses
  | 'DEPENSES_READ'
  | 'DEPENSES_WRITE'
  // Utilisateurs
  | 'USERS_READ'
  | 'USERS_WRITE'
  | 'USERS_DELETE'
  // Config
  | 'CONFIG_READ'
  | 'CONFIG_WRITE'
  // Métier Boutique
  | 'PROMOTIONS_READ'
  | 'PROMOTIONS_WRITE'
  | 'CREDIT_CLIENT_READ'
  | 'CREDIT_CLIENT_WRITE'
  // Métier Quincaillerie
  | 'DEVIS_READ'
  | 'DEVIS_WRITE'
  | 'DEVIS_EXPORT'
  | 'CHANTIERS_READ'
  | 'CHANTIERS_WRITE'
  | 'LIVRAISONS_READ'
  | 'LIVRAISONS_WRITE'
  // Métier Pharmacie
  | 'MEDICAMENTS_READ'
  | 'MEDICAMENTS_WRITE'
  | 'LOTS_READ'
  | 'LOTS_WRITE'
  | 'ORDONNANCES_READ'
  | 'ORDONNANCES_WRITE'
  | 'ALERTES_DLC_READ'
  // Métier Restaurant
  | 'TABLES_READ'
  | 'TABLES_WRITE'
  | 'COMMANDES_READ'
  | 'COMMANDES_WRITE'
  | 'MENU_READ'
  | 'MENU_WRITE'
  | 'CUISINE_READ'
  | 'CUISINE_WRITE'
  | 'RESERVATIONS_READ'
  | 'RESERVATIONS_WRITE'
  // Métier Téléphonie
  | 'TELEPHONES_READ'
  | 'TELEPHONES_WRITE'
  | 'IMEI_READ'
  | 'IMEI_WRITE'
  | 'REPARATIONS_READ'
  | 'REPARATIONS_WRITE'
  | 'GARANTIES_READ'
  | 'TOUT'; // Admin uniquement

// ─── Permissions communes à tous les rôles GERANT ───────────────
const GERANT_PERMISSIONS: Permission[] = ['TOUT'];

// ─── Rôles par métier ────────────────────────────────────────────
export const METIER_ROLES: Partial<Record<MetierType, RoleConfig[]>> = {

  // ── BOUTIQUE ──────────────────────────────────────────────────
  [MetierType.BOUTIQUE]: [
    {
      nom: 'GERANT',
      label: 'Gérant',
      permissions: GERANT_PERMISSIONS,
      isAdmin: true,
    },
    {
      nom: 'SUPERVISEUR',
      label: 'Superviseur',
      permissions: [
        'STOCK_READ', 'STOCK_WRITE',
        'VENTES_READ', 'VENTES_WRITE',
        'CLIENTS_READ', 'CLIENTS_WRITE',
        'FACTURES_READ', 'FACTURES_WRITE', 'FACTURES_EXPORT',
        'RAPPORTS_READ', 'RAPPORTS_EXPORT',
        'PROMOTIONS_READ', 'PROMOTIONS_WRITE',
        'DEPENSES_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'VENDEUR',
      label: 'Vendeur',
      permissions: [
        'STOCK_READ',
        'VENTES_READ', 'VENTES_WRITE',
        'CLIENTS_READ', 'CLIENTS_WRITE',
        'FACTURES_READ', 'FACTURES_WRITE',
        'PROMOTIONS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'CAISSIER',
      label: 'Caissier',
      permissions: [
        'VENTES_READ',
        'CAISSE_READ', 'CAISSE_WRITE', 'CAISSE_OPEN_CLOSE',
        'FACTURES_READ', 'FACTURES_WRITE',
        'CLIENTS_READ',
      ],
      isAdmin: false,
    },
  ],

  // ── QUINCAILLERIE ─────────────────────────────────────────────
  [MetierType.QUINCAILLERIE]: [
    {
      nom: 'GERANT',
      label: 'Gérant',
      permissions: GERANT_PERMISSIONS,
      isAdmin: true,
    },
    {
      nom: 'VENDEUR',
      label: 'Vendeur',
      permissions: [
        'STOCK_READ',
        'VENTES_READ', 'VENTES_WRITE',
        'CLIENTS_READ', 'CLIENTS_WRITE',
        'DEVIS_READ', 'DEVIS_WRITE', 'DEVIS_EXPORT',
        'CHANTIERS_READ', 'CHANTIERS_WRITE',
        'FACTURES_READ', 'FACTURES_WRITE',
        'FOURNISSEURS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'CAISSIER',
      label: 'Caissier',
      permissions: [
        'CAISSE_READ', 'CAISSE_WRITE', 'CAISSE_OPEN_CLOSE',
        'VENTES_READ',
        'FACTURES_READ', 'FACTURES_WRITE',
        'CLIENTS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'MAGASINIER',
      label: 'Magasinier',
      permissions: [
        'STOCK_READ', 'STOCK_WRITE',
        'LIVRAISONS_READ', 'LIVRAISONS_WRITE',
        'FOURNISSEURS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'TECHNICIEN',
      label: 'Technicien',
      permissions: [
        'STOCK_READ',
        'DEVIS_READ', 'DEVIS_WRITE',
        'CHANTIERS_READ',
      ],
      isAdmin: false,
    },
  ],

  // ── PHARMACIE ─────────────────────────────────────────────────
  [MetierType.PHARMACIE]: [
    {
      nom: 'PHARMACIEN',
      label: 'Pharmacien',
      permissions: GERANT_PERMISSIONS,
      isAdmin: true,
    },
    {
      nom: 'PREPARATEUR',
      label: 'Préparateur',
      permissions: [
        'STOCK_READ', 'STOCK_WRITE',
        'MEDICAMENTS_READ', 'MEDICAMENTS_WRITE',
        'LOTS_READ', 'LOTS_WRITE',
        'ALERTES_DLC_READ',
        'FOURNISSEURS_READ',
        'ORDONNANCES_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'CAISSIER',
      label: 'Caissier',
      permissions: [
        'CAISSE_READ', 'CAISSE_WRITE', 'CAISSE_OPEN_CLOSE',
        'VENTES_READ', 'VENTES_WRITE',
        'FACTURES_READ', 'FACTURES_WRITE',
        'CLIENTS_READ',
        'MEDICAMENTS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'RECEPTIONNISTE',
      label: 'Réceptionniste',
      permissions: [
        'CLIENTS_READ', 'CLIENTS_WRITE',
        'ORDONNANCES_READ', 'ORDONNANCES_WRITE',
        'MEDICAMENTS_READ',
      ],
      isAdmin: false,
    },
  ],

  // ── RESTAURANT ────────────────────────────────────────────────
  [MetierType.RESTAURANT]: [
    {
      nom: 'GERANT',
      label: 'Gérant',
      permissions: GERANT_PERMISSIONS,
      isAdmin: true,
    },
    {
      nom: 'SERVEUR',
      label: 'Serveur',
      permissions: [
        'TABLES_READ', 'TABLES_WRITE',
        'COMMANDES_READ', 'COMMANDES_WRITE',
        'MENU_READ',
        'CLIENTS_READ', 'CLIENTS_WRITE',
        'RESERVATIONS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'CAISSIER',
      label: 'Caissier',
      permissions: [
        'CAISSE_READ', 'CAISSE_WRITE', 'CAISSE_OPEN_CLOSE',
        'COMMANDES_READ',
        'FACTURES_READ', 'FACTURES_WRITE',
        'TABLES_READ',
        'CLIENTS_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'CUISINIER',
      label: 'Cuisinier',
      permissions: [
        'CUISINE_READ', 'CUISINE_WRITE',
        'COMMANDES_READ',
        'STOCK_READ',
        'MENU_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'BARMAN',
      label: 'Barman',
      permissions: [
        'COMMANDES_READ', 'COMMANDES_WRITE',
        'CAISSE_READ', 'CAISSE_WRITE',
        'STOCK_READ',
        'MENU_READ',
      ],
      isAdmin: false,
    },
  ],

  // ── TELEPHONIE ────────────────────────────────────────────────
  [MetierType.TELEPHONIE]: [
    {
      nom: 'GERANT',
      label: 'Gérant',
      permissions: GERANT_PERMISSIONS,
      isAdmin: true,
    },
    {
      nom: 'VENDEUR',
      label: 'Vendeur',
      permissions: [
        'STOCK_READ',
        'VENTES_READ', 'VENTES_WRITE',
        'CLIENTS_READ', 'CLIENTS_WRITE',
        'TELEPHONES_READ', 'TELEPHONES_WRITE',
        'IMEI_READ',
        'GARANTIES_READ',
        'FACTURES_READ', 'FACTURES_WRITE',
      ],
      isAdmin: false,
    },
    {
      nom: 'TECHNICIEN',
      label: 'Technicien',
      permissions: [
        'REPARATIONS_READ', 'REPARATIONS_WRITE',
        'STOCK_READ',
        'CLIENTS_READ',
        'TELEPHONES_READ',
        'IMEI_READ',
        'GARANTIES_READ',
      ],
      isAdmin: false,
    },
    {
      nom: 'CAISSIER',
      label: 'Caissier',
      permissions: [
        'CAISSE_READ', 'CAISSE_WRITE', 'CAISSE_OPEN_CLOSE',
        'VENTES_READ',
        'FACTURES_READ', 'FACTURES_WRITE',
        'CLIENTS_READ',
      ],
      isAdmin: false,
    },
  ],
  // ── SUPERMARCHE ───────────────────────────────────────────────
  [MetierType.SUPERMARCHE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'SUPERVISEUR', label: 'Superviseur', permissions: ['STOCK_READ','STOCK_WRITE','VENTES_READ','VENTES_WRITE','CLIENTS_READ','CLIENTS_WRITE','FACTURES_READ','FACTURES_WRITE','RAPPORTS_READ','RAPPORTS_EXPORT','PROMOTIONS_READ','PROMOTIONS_WRITE','DEPENSES_READ'], isAdmin: false },
    { nom: 'VENDEUR', label: 'Vendeur', permissions: ['STOCK_READ','VENTES_READ','VENTES_WRITE','CLIENTS_READ','CLIENTS_WRITE','FACTURES_READ','FACTURES_WRITE','PROMOTIONS_READ'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── CIMENT / BTP ─────────────────────────────────────────────
  [MetierType.CIMENT_BTP]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'COMMERCIAL', label: 'Commercial', permissions: ['STOCK_READ','VENTES_READ','VENTES_WRITE','CLIENTS_READ','CLIENTS_WRITE','DEVIS_READ','DEVIS_WRITE','LIVRAISONS_READ','LIVRAISONS_WRITE','FACTURES_READ','FACTURES_WRITE'], isAdmin: false },
    { nom: 'MAGASINIER', label: 'Magasinier', permissions: ['STOCK_READ','STOCK_WRITE','LIVRAISONS_READ','FOURNISSEURS_READ'], isAdmin: false },
    { nom: 'CHAUFFEUR', label: 'Chauffeur', permissions: ['LIVRAISONS_READ','LIVRAISONS_WRITE'], isAdmin: false },
  ],

  // ── PRESSING ──────────────────────────────────────────────────
  [MetierType.PRESSING]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'RECEPTIONNISTE', label: 'Réceptionniste', permissions: ['CLIENTS_READ','CLIENTS_WRITE','STOCK_READ'], isAdmin: false },
    { nom: 'LAVANDIER', label: 'Lavandier', permissions: ['STOCK_READ'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── GARAGE AUTOMOBILE ────────────────────────────────────────
  [MetierType.GARAGE_AUTOMOBILE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'MECANICIEN', label: 'Mécanicien', permissions: ['STOCK_READ','CLIENTS_READ'], isAdmin: false },
    { nom: 'CHEF_ATELIER', label: 'Chef d\'atelier', permissions: ['STOCK_READ','STOCK_WRITE','CLIENTS_READ','CLIENTS_WRITE','FOURNISSEURS_READ'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── ELEVAGE ──────────────────────────────────────────────────
  [MetierType.ELEVAGE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'ELEVEUR', label: 'Éleveur', permissions: ['STOCK_READ','STOCK_WRITE','CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'VETERINAIRE', label: 'Vétérinaire', permissions: ['STOCK_READ','CLIENTS_READ'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── SALON DE COIFFURE / BEAUTE ───────────────────────────────
  [MetierType.SALON_BEAUTE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'COIFFEUR', label: 'Coiffeur', permissions: ['CLIENTS_READ','CLIENTS_WRITE','STOCK_READ'], isAdmin: false },
    { nom: 'RECEPTIONNISTE', label: 'Réceptionniste', permissions: ['CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── PARFUMERIE / COSMETIQUE ──────────────────────────────────
  [MetierType.PARFUMERIE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'VENDEUR', label: 'Vendeur', permissions: ['STOCK_READ','VENTES_READ','VENTES_WRITE','CLIENTS_READ','CLIENTS_WRITE','FACTURES_READ','FACTURES_WRITE','PROMOTIONS_READ'], isAdmin: false },
    { nom: 'CONSEILLER', label: 'Conseiller(ère)', permissions: ['STOCK_READ','CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── BOULANGERIE / PATISSERIE ─────────────────────────────────
  [MetierType.BOULANGERIE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'BOULANGER', label: 'Boulanger', permissions: ['STOCK_READ','STOCK_WRITE'], isAdmin: false },
    { nom: 'PATISSIER', label: 'Pâtissier', permissions: ['STOCK_READ','STOCK_WRITE'], isAdmin: false },
    { nom: 'VENDEUR', label: 'Vendeur', permissions: ['STOCK_READ','VENTES_READ','VENTES_WRITE','CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── GLACIER / SNACK ──────────────────────────────────────────
  [MetierType.GLACIER_SNACK]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'SERVEUR', label: 'Serveur', permissions: ['COMMANDES_READ','COMMANDES_WRITE','CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── LIBRAIRIE / PAPETERIE ────────────────────────────────────
  [MetierType.LIBRAIRIE]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'VENDEUR', label: 'Vendeur', permissions: ['STOCK_READ','VENTES_READ','VENTES_WRITE','CLIENTS_READ','CLIENTS_WRITE','FACTURES_READ','FACTURES_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── CLINIQUE ──────────────────────────────────────────────────
  [MetierType.CLINIQUE]: [
    { nom: 'MEDECIN', label: 'Médecin', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'INFIRMIER', label: 'Infirmier(ère)', permissions: ['CLIENTS_READ','CLIENTS_WRITE','STOCK_READ'], isAdmin: false },
    { nom: 'RECEPTIONNISTE', label: 'Réceptionniste', permissions: ['CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'PHARMACIEN', label: 'Pharmacien', permissions: ['STOCK_READ','STOCK_WRITE','MEDICAMENTS_READ','MEDICAMENTS_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── TRANSPORT / LOGISTIQUE ───────────────────────────────────
  [MetierType.TRANSPORT]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'DISPATCHER', label: 'Dispatcher', permissions: ['CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'CHAUFFEUR', label: 'Chauffeur', permissions: [], isAdmin: false },
    { nom: 'MAGASINIER', label: 'Magasinier', permissions: ['STOCK_READ','STOCK_WRITE'], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],

  // ── GESTION IMMOBILIERE ─────────────────────────────────────
  [MetierType.IMMOBILIER]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'AGENT', label: 'Agent immobilier', permissions: ['CLIENTS_READ','CLIENTS_WRITE'], isAdmin: false },
    { nom: 'COMPTABLE', label: 'Comptable', permissions: ['RAPPORTS_READ','RAPPORTS_EXPORT','DEPENSES_READ','DEPENSES_WRITE','FACTURES_READ','FACTURES_WRITE'], isAdmin: false },
  ],

  // ── HOTEL ─────────────────────────────────────────────────────
  [MetierType.HOTEL]: [
    { nom: 'GERANT', label: 'Gérant', permissions: GERANT_PERMISSIONS, isAdmin: true },
    { nom: 'RECEPTIONNISTE', label: 'Réceptionniste', permissions: ['CLIENTS_READ','CLIENTS_WRITE','RESERVATIONS_READ','RESERVATIONS_WRITE'], isAdmin: false },
    { nom: 'FEMME_MENAGE', label: 'Femme de ménage', permissions: [], isAdmin: false },
    { nom: 'CAISSIER', label: 'Caissier', permissions: ['VENTES_READ','CAISSE_READ','CAISSE_WRITE','CAISSE_OPEN_CLOSE','FACTURES_READ','FACTURES_WRITE','CLIENTS_READ'], isAdmin: false },
  ],
};

// ─── Helper : récupère les rôles d'un métier ────────────────────
export function getRolesForMetier(metier: MetierType): RoleConfig[] {
  if (metier === MetierType.DEPOT_BOISSONS) return [];
  return METIER_ROLES[metier] ?? [];
}

// ─── Helper : récupère le rôle admin d'un métier ────────────────
export function getAdminRoleForMetier(metier: MetierType): RoleConfig | undefined {
  return getRolesForMetier(metier).find(r => r.isAdmin);
}