import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

/**
 * URL de base de l'API Campay pour les paiements MTN MoMo au Cameroun.
 */
const CAMPAY_API_BASE_URL = 'https://www.campay.net/api';

/**
 * Reponse de l'endpoint d'authentification Campay.
 */
interface CampayTokenResponse {
  token: string;
}

/**
 * Requete de collecte MTN MoMo via Campay.
 */
interface CampayCollectRequest {
  /** Montant TTC en XAF */
  amount: number;
  /** Devise toujours XAF pour le Cameroun */
  currency: 'XAF';
  /** Numero de telephone MTN MoMo du client */
  from: string;
  /** Description affichee au client */
  description: string;
  /** Reference externe (payment.id) pour idempotence */
  external_reference: string;
}

/**
 * Reponse de l'API Campay apres declenchement du paiement.
 */
interface CampayCollectResponse {
  /** Reference unique Campay de la transaction */
  reference: string;
  /** Code USSD a composer par le client */
  ussd_code?: string;
  /** Operateur detecte (MTN) */
  operator?: string;
  /** Statut initial de la transaction */
  status?: string;
}

/**
 * Reponse de l'API Campay pour le statut d'une transaction.
 */
interface CampayTransactionStatusResponse {
  reference: string;
  status: string;
  amount?: string;
  currency?: string;
  operator?: string;
  external_reference?: string;
}

/**
 * Service d'integration MTN MoMo via Campay.
 * Gere le flux de paiement : collecte, verification de statut, reconciliation CRON.
 *
 * Flux:
 * 1. Client choisit plan + saisit son numero MTN MoMo
 * 2. Backend cree Payment { status: PENDING, method: MTN_MOMO }
 * 3. Appel API Campay -> declenchement pop-up USSD sur mobile
 * 4. Client confirme le paiement sur son telephone
 * 5. Campay envoie webhook -> validation HMAC -> acces mis a jour
 */
@Injectable()
export class CampayService {
  private readonly logger = new Logger(CampayService.name);

  /**
   * Declenche une demande de paiement MTN MoMo via Campay.
   * Envoie une notification USSD au telephone du client.
   *
   * @param input - Parametres de la demande de collecte
   * @returns Reference Campay et code USSD a afficher
   * @throws InternalServerErrorException si l'appel API echoue
   */
  async collect(input: CampayCollectRequest): Promise<CampayCollectResponse> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${CAMPAY_API_BASE_URL}/collect/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        this.logger.error(
          JSON.stringify({
            action: 'campay_collect_failed',
            statusCode: response.status,
            externalReference: input.external_reference,
          }),
        );
        throw new Error('Campay collect failed.');
      }

      return (await response.json()) as CampayCollectResponse;
    } catch {
      throw new InternalServerErrorException({
        error: 'CAMPAY_COLLECT_FAILED',
        message:
          'Impossible de declencher le paiement MTN MoMo pour le moment.',
      });
    }
  }

  /**
   * Recupere le statut reel d'une transaction Campay pour reconciliation.
   * Utilise par le CRON de reconciliation quotidien.
   *
   * @param reference - Reference unique Campay de la transaction
   * @returns Statut complet de la transaction
   * @throws InternalServerErrorException si l'appel API echoue
   */
  async getTransactionStatus(
    reference: string,
  ): Promise<CampayTransactionStatusResponse> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `${CAMPAY_API_BASE_URL}/transaction/${reference}/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          JSON.stringify({
            action: 'campay_status_failed',
            statusCode: response.status,
            reference,
          }),
        );
        throw new Error('Campay status failed.');
      }

      return (await response.json()) as CampayTransactionStatusResponse;
    } catch {
      throw new InternalServerErrorException({
        error: 'CAMPAY_STATUS_FAILED',
        message: 'Impossible de verifier le statut Campay pour le moment.',
      });
    }
  }

  /**
   * Authentifie le backend aupres de Campay.
   * Recupere un token JWT temporaire pour les appels API.
   *
   * @returns Token d'authentification Campay
   * @throws Error si l'authentification echoue
   */
  private async getAccessToken(): Promise<string> {
    const username = this.getRequiredEnv('CAMPAY_APP_USERNAME');
    const password = this.getRequiredEnv('CAMPAY_APP_PASSWORD');

    const response = await fetch(`${CAMPAY_API_BASE_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      this.logger.error(
        JSON.stringify({
          action: 'campay_auth_failed',
          statusCode: response.status,
        }),
      );
      throw new Error('Campay authentication failed.');
    }

    const payload = (await response.json()) as CampayTokenResponse;
    return payload.token;
  }

  /**
   * Retourne une variable d'environnement Campay obligatoire.
   *
   * @param name - Nom de la variable d'environnement
   * @returns Valeur de la variable
   * @throws InternalServerErrorException si la variable est manquante
   */
  private getRequiredEnv(
    name: 'CAMPAY_APP_USERNAME' | 'CAMPAY_APP_PASSWORD',
  ): string {
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
