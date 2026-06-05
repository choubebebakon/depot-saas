import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Service d'integration Stripe pour les paiements par carte Visa/MasterCard.
 * Gere les PaymentIntents, webhooks et reconciliation.
 *
 * Flux:
 * 1. Client choisit plan + clique "Payer par carte"
 * 2. Frontend affiche Stripe Elements (formulaire PCI-compliant)
 * 3. Backend cree un PaymentIntent Stripe { amount: totalXAF, currency: "xaf" }
 * 4. Frontend confirme via stripe.confirmCardPayment(clientSecret)
 * 5. Stripe envoie webhook -> verification signature -> acces mis a jour
 */
@Injectable()
export class StripePaymentsService {
  private readonly logger = new Logger(StripePaymentsService.name);
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(this.getRequiredEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-08-27.basil',
    });
  }

  /**
   * Cree un PaymentIntent Stripe pour un paiement carte en XAF.
   * Le client_secret retourne est utilise par Stripe Elements cote frontend.
   *
   * @param input - Parametres du paiement (paymentId, tenantId, amount, method)
   * @returns PaymentIntent Stripe avec client_secret pour le frontend
   * @throws InternalServerErrorException si la creation echoue
   */
  async createPaymentIntent(input: {
    paymentId: string;
    tenantId: string;
    amountXaf: number;
    method: 'VISA_CARD' | 'MASTERCARD';
  }): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.create({
        amount: input.amountXaf,
        currency: 'xaf',
        automatic_payment_methods: { enabled: true },
        metadata: {
          paymentId: input.paymentId,
          tenantId: input.tenantId,
          method: input.method,
        },
      });
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          action: 'stripe_payment_intent_failed',
          tenantId: input.tenantId,
          paymentId: input.paymentId,
          method: input.method,
        }),
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        error: 'STRIPE_PAYMENT_INTENT_FAILED',
        message: 'Impossible de preparer le paiement par carte pour le moment.',
      });
    }
  }

  /**
   * Verifie et construit un evenement Stripe depuis le rawBody signe.
   * Utilise stripe.webhooks.constructEvent pour la validation de signature.
   *
   * Validation Webhook Stripe (Anti-fraude obligatoire):
   * ① stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
   * ② Si erreur de signature → HTTP 400 + log Sentry
   * ③ Events a ecouter: payment_intent.succeeded, payment_intent.payment_failed
   *
   * @param rawBody - Corps brut de la requete webhook (Buffer)
   * @param signature - Signature Stripe-Signature du header
   * @returns Evenement Stripe valide
   * @throws Error si la signature est invalide
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.getRequiredEnv('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          action: 'stripe_webhook_signature_invalid',
        }),
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  /**
   * Recupere le statut reel d'un PaymentIntent pour reconciliation.
   * Utilise par le CRON de reconciliation quotidien.
   *
   * @param paymentIntentId - ID Stripe du PaymentIntent
   * @returns PaymentIntent avec son statut actuel
   * @throws InternalServerErrorException si la recuperation echoue
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          action: 'stripe_retrieve_payment_intent_failed',
          stripePaymentIntentId: paymentIntentId,
        }),
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        error: 'STRIPE_RECONCILIATION_FAILED',
        message: 'Impossible de verifier le paiement carte pour le moment.',
      });
    }
  }

  /**
   * Retourne une variable d'environnement Stripe obligatoire.
   *
   * @param name - Nom de la variable d'environnement
   * @returns Valeur de la variable
   * @throws InternalServerErrorException si la variable est manquante
   */
  private getRequiredEnv(name: 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'): string {
    const value = process.env[name];

    if (!value) {
      throw new InternalServerErrorException({
        error: 'ENV_MISSING',
        message: `Variable d'environnement manquante: ${name}.`,
      });
    }

    return value;
  }
}
