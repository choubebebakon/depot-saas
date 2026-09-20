import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NotchPayService {
  private readonly logger = new Logger(NotchPayService.name);

  getWebhookSecret(): string {
    const secret = process.env.NOTCHPAY_HASH_KEY;
    if (!secret) {
      throw new Error(
        'NOTCHPAY_HASH_KEY manquant dans .env — obligatoire pour verifier les webhooks NotchPay.',
      );
    }
    return secret;
  }

  /**
   * Verify NotchPay webhook signature using HMAC SHA256
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = this.getWebhookSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  async initializePayment(data: any) {
    try {
      this.logger.log(`Body envoye a NotchPay: ${JSON.stringify(data)}`);
      const notchPayUrl = `${process.env.NOTCHPAY_ENDPOINT || 'https://api.notchpay.co'}/payments/initialize`;
      this.logger.log(`URL NotchPay: ${notchPayUrl}`);

      // ── PAYLOAD CONFORME À L'OpenAPI NotchPay 2.1.0 (fait vérifié) ──────
      // Champs réellement documentés pour POST /payments :
      //   amount, currency, customer, phone, email, description, reference,
      //   callback, locked_currency, locked_channel, locked_country.
      // ⚠️ `channel` N'EST PAS un champ documenté : forcer la méthode choisie
      // par le commerçant passe par `locked_channel` (ex. 'cm.mtn'). Sans lui,
      // la page hébergée affiche TOUS les canaux et le choix est ignoré.
      // ⚠️ `callback` = URL de retour après paiement (facultatif ; NotchPay
      // redirige avec ?reference=trx.…&status=…&trxref=<notre référence>).
      // ⚠️ INCIDENT MESURÉ (sonde réelle sur le compte LIVE GesTock) :
      // envoyer `locked_channel` ('cm.mtn' OU 'cm.orange', avec ou sans `phone`)
      // fait basculer la page hébergée sur « Méthode de paiement indisponible »,
      // alors que la MÊME page SANS verrou affiche correctement la liste des
      // méthodes (MTN MoMo + Orange Money CM). Le verrou est donc bien pris en
      // compte par NotchPay, mais le parcours « collect verrouillé » n'est pas
      // opérationnel sur ce compte (à clarifier avec le support NotchPay).
      // → On ne l'envoie QUE si NOTCHPAY_LOCK_CHANNEL=true. Par défaut (false),
      //   la page propose les canaux RÉELLEMENT actifs du compte, et le
      //   commerçant y choisit sa méthode.
      const lockChannel = process.env.NOTCHPAY_LOCK_CHANNEL === 'true';
      const lockedChannel = data.lockedChannel ?? data.channel;
      const lockedCurrency = data.lockedCurrency ?? data.currency;
      const payload: Record<string, unknown> = {
        amount: data.amount,
        currency: data.currency,
        customer: data.customer,
        description: data.description,
        reference: data.reference,
      };
      if (data.phone) payload.phone = data.phone;
      const email = data.email ?? data.customer?.email;
      if (email) payload.email = email;
      if (data.callback) payload.callback = data.callback;
      if (lockChannel && lockedChannel) payload.locked_channel = lockedChannel;
      // `locked_country` n'est PAS reflété dans la réponse et n'a produit aucun
      // effet observable sur la page : envoyé uniquement si le verrou est activé.
      if (lockChannel && data.lockedCountry) {
        payload.locked_country = data.lockedCountry;
      }
      // `locked_currency` est accepté et reflété dans la réponse (vérifié en
      // LIVE) : inoffensif, conservé pour garantir la devise XAF.
      if (lockedCurrency) payload.locked_currency = lockedCurrency;
      // `meta` n'apparaît pas dans le schéma documenté mais est accepté par
      // l'API (vérifié en LIVE : HTTP 201) et sert au rapprochement des
      // webhooks. Aucun effet de bord s'il est ignoré côté NotchPay.
      payload.meta = {
        tenantId: data.tenantId,
        plan: data.plan,
        email: data.customer?.email,
      };

      // FAIT VALIDÉ n°1 (compte LIVE GesTock) : les endpoints de paiement
      // standard s'authentifient avec la clé PUBLIQUE dans `Authorization`.
      // La clé privée (X-Grant) ne sert QUE pour les endpoints à risque
      // (transferts). Envoyer la clé privée ici provoquait le 401
      // "Invalid API credentials" constaté en production.
      const response = await axios.post(notchPayUrl, payload, {
        headers: {
          Authorization: process.env.NOTCHPAY_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });
      return response.data;
    } catch (error: any) {
      // DIAGNOSTIC PROD : ne plus avaler l'erreur provider — la remonter
      // structurée (code HTTP + message NotchPay) sans jamais exposer la clé.
      const providerMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      const providerStatusCode = error.response?.status;
      this.logger.error(
        `Erreur NotchPay detaillee (HTTP ${providerStatusCode ?? 'réseau'}): ${JSON.stringify(
          error.response?.data || error.response?.body || error.message,
        )}`,
      );
      const enriched = new Error(
        `Erreur API NotchPay (${providerStatusCode ?? 'réseau'}): ${providerMessage}`,
      );
      (enriched as any).providerStatusCode = providerStatusCode;
      (enriched as any).providerMessage = providerMessage;
      throw enriched;
    }
  }

  /**
   * Vérifie l'état d'une transaction NotchPay côté API (mécanisme "pull").
   *
   * RÔLE : filet de sécurité du CRON de reconciliation — si le webhook signé
   * est perdu (délai d'attente proxy, indisponibilité momentanée, purge), un
   * paiement réellement réussi ne doit pas rester PENDING pour toujours.
   * Le webhook signé reste le déclencheur CANONIQUE de l'activation ; cette
   * vérification est un rattrapage secondaire, jamais un contournement.
   *
   * ⚠️ À CONFIRMER (PARTIE 6) : le chemin exact (GET /payments/{ref}) et la
   * forme de la réponse proviennent de la convention de l'API NotchPay ; les
   * docs n'étant pas joignables depuis l'environnement de build, confirmer
   * sur le compte GesTock avant de compter dessus en production. En cas
   * d'erreur, la méthode jette : l'appelant (cron) ne modifie RIEN — un
   * paiement ne bascule en FAILED que sur une réponse explicite.
   */
  async verifyTransaction(reference: string): Promise<{
    id?: string;
    reference?: string;
    trxref?: string;
    status?: string;
    meta?: Record<string, unknown>;
  }> {
    const url = `${process.env.NOTCHPAY_ENDPOINT || 'https://api.notchpay.co'}/payments/${encodeURIComponent(reference)}`;
    try {
      // FAIT VALIDÉ n°1 : endpoint de lecture standard → clé PUBLIQUE dans
      // `Authorization` (la clé privée/X-Grant n'est pas nécessaire ici).
      const response = await axios.get(url, {
        headers: {
          Authorization: process.env.NOTCHPAY_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      return response.data?.transaction ?? response.data ?? {};
    } catch (error: any) {
      this.logger.error(
        `verifyTransaction(${reference}) échec: ${JSON.stringify(error.response?.data || error.message)}`,
      );
      throw new Error('Erreur API NotchPay (verifyTransaction)');
    }
  }
}
