import { RoleUser } from '@prisma/client';

/**
 * Niveaux d'accès regroupés pour simplifier la maintenance des permissions
 * tout en gardant la granularité des rôles Prisma.
 */

export const ACCESS_LEVELS = {
  // Administrateur : Accès total (Finances, Paramètres)
  ADMIN: [RoleUser.PATRON],

  // Gérant : Gestion des stocks, transferts, inventaires
  GERANT: [
    RoleUser.PATRON, 
    RoleUser.GERANT, 
    RoleUser.MAGASINIER, 
    RoleUser.COMPTABLE
  ],

  // Vendeur : Uniquement la caisse, le mixage et l'impression
  // Note: On inclut les gérants/patrons car ils peuvent aussi vendre.
  VENDEUR: [
    RoleUser.PATRON,
    RoleUser.GERANT,
    RoleUser.CAISSIER,
    RoleUser.COMMERCIAL,
    RoleUser.MAGASINIER
  ],

  // Public (Utilisateurs connectés uniquement)
  AUTHENTICATED: Object.values(RoleUser),
};
