import { z } from 'zod';

/**
 * Schéma de validation pour les retours de consignes (vides)
 */
export const retourConsigneSchema = z.object({
  typeConsigneId: z.string().uuid("Type de consigne invalide"),
  quantite: z.coerce.number().min(1, "La quantité doit être supérieure à 0"),
});

/**
 * Schéma principal de la vente au POS
 * Gère le nettoyage automatique des ID (chaîne vide -> null)
 */
export const venteSchema = z.object({
  // Transformation critique : évite d'envoyer "" ou "null" au backend
  clientId: z.string().uuid().nullable().optional().transform(v => v === '' || v === 'null' ? null : v),
  depotId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CREDIT', 'MIXTE']).default('CASH'),
  
  lignes: z.array(z.object({
    articleId: z.string().uuid(),
    quantite: z.coerce.number().min(1, "Quantité minimale : 1"),
    prix: z.coerce.number().optional(),
    remise: z.coerce.number().optional().default(0),
    // Nettoyage du conditionnement
    conditionnementId: z.string().uuid().nullable().optional().transform(v => v === '' || v === 'null' ? null : v),
  })).optional().default([]),

  // Nouveau champ pour la Phase 1
  retoursConsigne: z.array(retourConsigneSchema).optional().default([]),
});
