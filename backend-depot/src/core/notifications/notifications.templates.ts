import { NotifType, NotifCategory, NotifPriority } from '@prisma/client';

interface TemplateDef {
  title: string;
  message: string;
  category: NotifCategory;
  priority: NotifPriority;
}

export const TEMPLATES: Record<NotifType, TemplateDef> = {
  EXPIRY_WARNING: {
    title: 'Abonnement expire bientôt',
    message: 'Votre abonnement expire dans {{jours}} jours ({{dateExpiration}}).',
    category: 'SUBSCRIPTION',
    priority: 'HIGH',
  },
  EXPIRY_J7: {
    title: 'Abonnement J-7',
    message: 'Votre abonnement {{plan}} expire dans 7 jours, le {{dateExpiration}}.',
    category: 'SUBSCRIPTION',
    priority: 'HIGH',
  },
  EXPIRY_J3: {
    title: 'Abonnement J-3',
    message: 'URGENT : Votre abonnement {{plan}} expire dans 3 jours.',
    category: 'SUBSCRIPTION',
    priority: 'CRITICAL',
  },
  EXPIRY_J1: {
    title: 'Abonnement J-1',
    message: 'DERNIER JOUR : Votre abonnement {{plan}} expire demain !',
    category: 'SUBSCRIPTION',
    priority: 'CRITICAL',
  },
  PAYMENT_SUCCESS: {
    title: 'Paiement reçu',
    message: 'Paiement de {{montant}} FCFA reçu par {{methode}}.',
    category: 'PAYMENT',
    priority: 'HIGH',
  },
  PAYMENT_FAILED: {
    title: 'Paiement échoué',
    message: 'Le paiement de {{montant}} FCFA a échoué.{{raison}}',
    category: 'PAYMENT',
    priority: 'CRITICAL',
  },
  SYSTEM: {
    title: 'Notification système',
    message: '{{message}}',
    category: 'SYSTEM',
    priority: 'MEDIUM',
  },
  STOCK_CRITIQUE: {
    title: 'Stock critique',
    message: '{{articleNom}} : {{quantite}} unités restantes (seuil : {{seuil}}).',
    category: 'STOCK',
    priority: 'HIGH',
  },
  STOCK_RUPTURE: {
    title: 'Rupture de stock',
    message: '{{articleNom}} est en rupture de stock.',
    category: 'STOCK',
    priority: 'HIGH',
  },
  STOCK_EXPIRATION: {
    title: 'Produit proche expiration',
    message: '{{articleNom}} expire le {{dateExpiration}} (J-{{joursRestants}}).',
    category: 'STOCK',
    priority: 'HIGH',
  },
  RESERVATION_NOUVELLE: {
    title: 'Nouvelle réservation',
    message: 'Chambre {{numeroChambre}} réservée par {{nomClient}} du {{dateArrivee}}.',
    category: 'RESERVATION',
    priority: 'MEDIUM',
  },
  RESERVATION_ANNULEE: {
    title: 'Réservation annulée',
    message: 'Réservation chambre {{numeroChambre}} annulée par {{nomClient}}.',
    category: 'RESERVATION',
    priority: 'LOW',
  },
  COMMANDE_NOUVELLE: {
    title: 'Nouvelle commande',
    message: 'Commande #{{numeroCommande}} de {{montant}} FCFA reçue.',
    category: 'ORDER',
    priority: 'HIGH',
  },
  COMMANDE_PRETE: {
    title: 'Commande prête',
    message: 'Commande #{{numeroCommande}} est prête à être servie.',
    category: 'ORDER',
    priority: 'HIGH',
  },
  COMMANDE_RETARD: {
    title: 'Commande en retard',
    message: 'Commande #{{numeroCommande}} a dépassé le délai de {{retardMinutes}} min.',
    category: 'ORDER',
    priority: 'CRITICAL',
  },
  REPARATION_PRETE: {
    title: 'Réparation terminée',
    message: 'Véhicule {{vehicule}} de {{client}} est prêt.',
    category: 'MAINTENANCE',
    priority: 'HIGH',
  },
  CHECKIN_HOTEL: {
    title: 'Check-in effectué',
    message: 'Chambre {{chambre}} — Check-in de {{client}}.',
    category: 'RESERVATION',
    priority: 'MEDIUM',
  },
  CHECKOUT_HOTEL: {
    title: 'Check-out effectué',
    message: 'Chambre {{chambre}} — Check-out de {{client}}.',
    category: 'RESERVATION',
    priority: 'LOW',
  },
  CHAMBRE_MENAGE: {
    title: 'Chambre à nettoyer',
    message: 'Chambre {{chambre}} libérée, ménage requis.',
    category: 'MAINTENANCE',
    priority: 'LOW',
  },
  RDV_RAPPEL: {
    title: 'Rappel de rendez-vous',
    message: 'Rendez-vous avec {{patient}} à {{heure}}.',
    category: 'APPOINTMENT',
    priority: 'HIGH',
  },
  RDV_ANNULE: {
    title: 'Rendez-vous annulé',
    message: 'Le rendez-vous avec {{patient}} a été annulé.',
    category: 'APPOINTMENT',
    priority: 'MEDIUM',
  },
  VACCINATION_PREVUE: {
    title: 'Vaccination prévue',
    message: 'Vaccination {{type}} prévue pour le lot {{lotId}} le {{datePrevue}}.',
    category: 'APPOINTMENT',
    priority: 'MEDIUM',
  },
  LIVRAISON_TERMINEE: {
    title: 'Livraison terminée',
    message: 'Livraison à {{client}} terminée — {{montant}} FCFA.',
    category: 'DELIVERY',
    priority: 'LOW',
  },
  CONNEXION_SUSPECTE: {
    title: 'Connexion suspecte',
    message: 'Tentative de connexion suspecte détectée depuis {{ip}}.',
    category: 'SECURITY',
    priority: 'CRITICAL',
  },
  TENTATIVE_ECHEC: {
    title: 'Tentative échouée',
    message: '{{tentatives}} tentatives de connexion échouées pour {{email}}.',
    category: 'SECURITY',
    priority: 'HIGH',
  },
  ALERTE_PREDICTIVE: {
    title: 'Alerte prédictive',
    message: '{{message}} (score : {{score}}%).',
    category: 'IA',
    priority: 'HIGH',
  },
  RAPPORT_JOURNALIER: {
    title: 'Rapport journalier',
    message: 'Ventes : {{ventesJour}} | Nouveaux clients : {{nouveauClients}} | Alertes : {{alertes}}.',
    category: 'IA',
    priority: 'LOW',
  },
};

export function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    if (value === null || value === undefined) return `{{${key}}}`;
    return String(value);
  });
}

export function getTemplate(type: NotifType, data: Record<string, unknown>): { title: string; message: string } {
  const tpl = TEMPLATES[type] || TEMPLATES.SYSTEM;
  return {
    title: interpolate(tpl.title, data),
    message: interpolate(tpl.message, data),
  };
}

export function getCategory(type: NotifType): NotifCategory {
  return TEMPLATES[type]?.category || 'SYSTEM';
}

export function getPriority(type: NotifType): NotifPriority {
  return TEMPLATES[type]?.priority || 'MEDIUM';
}
