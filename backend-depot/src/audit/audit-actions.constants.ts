/**
 * Catalogue des actions d'audit utilisées dans GeStock.
 * `action` reste un String en base (pas un enum Prisma strict) pour rester
 * compatible avec l'historique et flexible pour les futurs métiers — mais
 * toute nouvelle instrumentation DOIT piocher dans cette liste pour garder
 * le journal patron cohérent et filtrable.
 */
export const AUDIT_ACTIONS = {
  // Stock
  ENTREE_STOCK: 'ENTREE_STOCK',
  SORTIE_STOCK: 'SORTIE_STOCK',
  AJUSTEMENT_STOCK: 'AJUSTEMENT_STOCK',
  SIGNALEMENT_AVARIE: 'SIGNALEMENT_AVARIE',
  TRANSFERT_CREE: 'TRANSFERT_CREE',
  TRANSFERT_VALIDE: 'TRANSFERT_VALIDE',
  TRANSFERT_ANNULE: 'TRANSFERT_ANNULE',

  // Ventes
  VENTE_CREEE: 'VENTE_CREEE',
  VENTE_ANNULEE: 'VENTE_ANNULEE',
  REMISE_ACCORDEE: 'REMISE_ACCORDEE',
  VALIDATION_STOCK_MAGASINIER: 'VALIDATION_STOCK_MAGASINIER',

  // Réceptions fournisseurs
  RECEPTION_CREEE: 'RECEPTION_CREEE',
  RECEPTION_VALIDEE: 'RECEPTION_VALIDEE',
  RECEPTION_ANNULEE: 'RECEPTION_ANNULEE',

  // Suppressions génériques
  SUPPRESSION_ARTICLE: 'SUPPRESSION_ARTICLE',
  SUPPRESSION_UTILISATEUR: 'SUPPRESSION_UTILISATEUR',
  SUPPRESSION_CLIENT: 'SUPPRESSION_CLIENT',

  // Utilisateurs
  UTILISATEUR_CREE: 'UTILISATEUR_CREE',
  UTILISATEUR_MODIFIE: 'UTILISATEUR_MODIFIE',
  UTILISATEUR_DESACTIVE: 'UTILISATEUR_DESACTIVE',

  // Caisse / dépenses
  DEPENSE_ENREGISTREE: 'DEPENSE_ENREGISTREE',
  CAISSE_OUVERTE: 'CAISSE_OUVERTE',
  CAISSE_FERMEE: 'CAISSE_FERMEE',
  ENTREE_CAISSE: 'ENTREE_CAISSE',
  SORTIE_CAISSE: 'SORTIE_CAISSE',

  // Fournisseurs / clients — finance
  DETTE_FOURNISSEUR_REGLEE: 'DETTE_FOURNISSEUR_REGLEE',
  DETTE_CLIENT_REGLEE: 'DETTE_CLIENT_REGLEE',

  // Inventaires (comptage physique périodique — distinct d'un ajustement
  // ponctuel unitaire : couvre plusieurs articles en une seule opération)
  INVENTAIRE_REALISE: 'INVENTAIRE_REALISE',

  // Authentification / sécurité du compte
  CONNEXION: 'CONNEXION',
  DECONNEXION: 'DECONNEXION',
  ECHEC_CONNEXION: 'ECHEC_CONNEXION',
  CHANGEMENT_MOT_DE_PASSE: 'CHANGEMENT_MOT_DE_PASSE',
} as const;

export type AuditActionKey = keyof typeof AUDIT_ACTIONS;