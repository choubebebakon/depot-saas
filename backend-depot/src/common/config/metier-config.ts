// src/common/config/metier-config.ts

export interface MetierConfig {
  keywords: string[];
  tableSpecifique: string | null;
  questionCritique: string;
}

/**
 * Mapping des synonymes pour la détection sémantique.
 * Ajoute ici toute nouvelle variante utilisateur pour améliorer l'IA.
 */
const SYNONYMES: Record<string, string[]> = {
  dlc: ['date limite', 'péremption', 'périmé', 'expiration'],
  stock: ['inventaire', 'quantité', 'disponibilité', 'rupture', 'épuisé'],
  rdv: ['rendez-vous', 'consultation', 'examen', 'passage'],
  vente: ['chiffre', 'recette', 'vendu', 'transaction', 'encaissement'],
  chambre: ['nuitée', 'lit', 'hébergement', 'occupation'],
  table: ['couvert', 'service', 'place'],
  véhicule: ['voiture', 'auto', 'engin', 'camion'],
  livraison: ['transport', 'colis', 'trajet'],
};

export const METIER_CONFIG: Record<string, MetierConfig> = {
  DEPOT_BOISSONS: {
    keywords: ['boisson', 'dépôt', 'stock', 'rupture', 'vente', 'fournisseur'],
    tableSpecifique: null,
    questionCritique:
      'Quel est mon stock de sécurité sur les boissons les plus vendues ?',
  },
  BOUTIQUE: {
    keywords: [
      'boutique',
      'promotion',
      'rayon',
      'stock',
      'rupture',
      'vente',
      'client',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels produits ont le taux de rotation le plus faible ?',
  },
  PHARMACIE: {
    keywords: [
      'médicament',
      'dlc',
      'expiration',
      'ordonnance',
      'lot',
      'périmé',
    ],
    tableSpecifique: 'medicament',
    questionCritique: 'Quels médicaments expirent dans les 7 prochains jours ?',
  },
  RESTAURANT: {
    keywords: ['table', 'couvert', 'commande', 'cuisine', 'menu', 'plat'],
    tableSpecifique: 'table',
    questionCritique: 'Combien de tables sont occupées en ce moment ?',
  },
  HOTEL: {
    keywords: [
      'chambre',
      'réservation',
      'disponible',
      'occupée',
      'libre',
      'occupation',
    ],
    tableSpecifique: 'chambre',
    questionCritique: "Quel est mon taux d'occupation pour ce week-end ?",
  },
  // ... (Garde tes autres métiers ici, la structure est valide)
  QUINCAILLERIE: {
    keywords: [
      'quincaillerie',
      'devis',
      'chantier',
      'matériel',
      'outillage',
      'btp',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels chantiers ont le plus gros retard de livraison ?',
  },
  SUPERMARCHE: {
    keywords: ['supermarché', 'rayon', 'caisse', 'stock', 'rupture', 'client'],
    tableSpecifique: null,
    questionCritique: 'Quels rayons ont le plus fort taux de rupture ?',
  },
  GARAGE_AUTOMOBILE: {
    keywords: [
      'garage',
      'véhicule',
      'réparation',
      'pièce',
      'mécanique',
      'atelier',
    ],
    tableSpecifique: null,
    questionCritique: 'Combien de véhicules sont en attente de pièces ?',
  },
  CLINIQUE: {
    keywords: ['clinique', 'rdv', 'patient', 'consultation', 'médecin', 'soin'],
    tableSpecifique: null,
    questionCritique:
      "Quel est le temps d'attente moyen pour une consultation ?",
  },
  TRANSPORT: {
    keywords: [
      'transport',
      'colis',
      'trajet',
      'livraison',
      'camion',
      'logistique',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels trajets ont le plus de retard ?',
  },
  IMMOBILIER: {
    keywords: [
      'immobilier',
      'bien',
      'loyer',
      'réservation',
      'location',
      'appartement',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels biens ont la plus longue vacance locative ?',
  },
  ELEVAGE: {
    keywords: [
      'élevage',
      'lot',
      'troupeau',
      'vaccination',
      'animal',
      'aliment',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels troupeaux ont besoin de vaccination urgente ?',
  },
  BOULANGERIE: {
    keywords: [
      'boulangerie',
      'production',
      'recette',
      'farine',
      'pain',
      'four',
    ],
    tableSpecifique: null,
    questionCritique: 'Quelle est la consommation moyenne de farine par jour ?',
  },
  PRESSING: {
    keywords: ['pressing', 'ticket', 'vêtement', 'lavage', 'repassage', 'prêt'],
    tableSpecifique: null,
    questionCritique: 'Quel est le délai moyen de traitement des vêtements ?',
  },
  SALON_BEAUTE: {
    keywords: ['salon', 'beauté', 'rdv', 'prestation', 'coiffure', 'soin'],
    tableSpecifique: null,
    questionCritique:
      "Quelles prestations ont le plus fort taux d'annulation ?",
  },
  PARFUMERIE: {
    keywords: [
      'parfumerie',
      'parfum',
      'cosmétique',
      'fidélité',
      'client',
      'promotion',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels clients ont le programme fidélité le plus actif ?',
  },
  LIBRAIRIE: {
    keywords: [
      'librairie',
      'livre',
      'nouveauté',
      'commande',
      'auteur',
      'éditeur',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels livres ont le plus fort taux de rotation ?',
  },
  GLACIER_SNACK: {
    keywords: ['glacier', 'snack', 'glace', 'table', 'commande', 'menu'],
    tableSpecifique: null,
    questionCritique: 'Quels glaciers ont le plus fort taux de vente ?',
  },
  CIMENT_BTP: {
    keywords: [
      'ciment',
      'btp',
      'chantier',
      'livraison',
      'matériau',
      'véhicule',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels chantiers ont le plus gros retard de livraison ?',
  },
  TELEPHONIE: {
    keywords: [
      'téléphonie',
      'téléphone',
      'réparation',
      'imei',
      'samsung',
      'iphone',
    ],
    tableSpecifique: null,
    questionCritique: 'Quels modèles ont le plus fort taux de retour SAV ?',
  },
};

export const GENERIC_CONFIG: MetierConfig = {
  keywords: ['stock', 'rupture', 'vente', 'client', 'fournisseur', 'caisse'],
  tableSpecifique: null,
  questionCritique: 'Quel est mon bilan du mois ?',
};

export function getMetierConfig(metier: string): MetierConfig {
  return METIER_CONFIG[metier] ?? GENERIC_CONFIG;
}

/**
 * Logique de détection enrichie avec les synonymes
 */
export function isRelevant(message: string, config: MetierConfig): boolean {
  const normalizedMessage = message.toLowerCase().trim();

  return config.keywords.some((keyword) => {
    const k = keyword.toLowerCase();

    // Vérification directe
    if (normalizedMessage.includes(k)) return true;

    // Vérification par synonyme
    return (
      SYNONYMES[k]?.some((syn) => normalizedMessage.includes(syn)) ?? false
    );
  });
}
