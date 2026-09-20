import { createHmac } from 'node:crypto';
import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { META_GRAPH_BASE_URL } from '../meta.constants';
import { META_CONFIG } from '../meta.config';
import type { MetaConfig } from '../meta.config';

/**
 * Client Graph API — STRICTEMENT serveur à serveur (fait vérifié n°2 : l'app
 * secret ne quitte JAMAIS le backend ; aucune requête Graph n'est faite depuis
 * le navigateur du commerçant).
 *
 * Journalisation : les requêtes sont loggées avec leur endpoint et le code
 * HTTP ; les réponses (donc jamais les tokens) ne le sont qu'en cas d'échec.
 */
@Injectable()
export class MetaGraphApiService {
  private readonly logger = new Logger(MetaGraphApiService.name);

  constructor(
    private readonly http: HttpService,
    // MetaConfig est une INTERFACE : sans @Inject, TypeScript émet `Object`
    // dans design:paramtypes et Nest échoue à résoudre la dépendance au boot.
    @Inject(META_CONFIG) private readonly config: MetaConfig,
  ) {}

  /**
   * Échange du code d'autorisation contre un access token (fait vérifié n°2).
   * Requête serveur-à-serveur : le code arrive du frontend, le secret reste ici.
   */
  async exchangeCodeForToken(code: string): Promise<GraphTokenResponse> {
    if (!this.config.appId || !this.config.appSecret) {
      throw new ServiceUnavailableException('Intégration Meta non configurée.');
    }
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      code,
    });
    return this.get<GraphTokenResponse>('/oauth/access_token', params);
  }

  /**
   * Inspecte un token : scopes réellement accordés, WABA/Pages, expiration.
   * (fait vérifié n°5 : GET /debug_token?input_token=...)
   */
  async debugToken(inputToken: string): Promise<DebugTokenData> {
    if (!this.config.appId || !this.config.appSecret) {
      throw new ServiceUnavailableException('Intégration Meta non configurée.');
    }
    const params = new URLSearchParams({
      input_token: inputToken,
      access_token: `${this.config.appId}|${this.config.appSecret}`,
    });
    const res = await this.get<{ data: DebugTokenData }>('/debug_token', params);
    return res.data;
  }

  /**
   * Étape 2 de l'onboarding (fait vérifié n°3a) : enregistrement du numéro de
   * téléphone pour l'usage Cloud API. Sans cette étape, la WABA peut exister
   * mais aucun message ne part et n'arrive. Idempotent : « déjà enregistré »
   * n'est pas une erreur bloquante.
   */
  async registerPhoneNumber(phoneNumberId: string, accessToken: string, pin: string): Promise<boolean> {
    try {
      await this.post(`/${phoneNumberId}/register`, { messaging_product: 'whatsapp', pin }, accessToken);
      return true;
    } catch (err) {
      const g = extractGraphError(err as AxiosError<{ error?: { message?: string; code?: number; error_subcode?: number } }>);
      // Erreur Graph 1363030 « numéro déjà enregistré » : état déjà atteint.
      if (g.code === 1363030 || /already registered/i.test(g.message ?? '')) {
        this.logger.warn(`registerPhoneNumber: numéro ${phoneNumberId} déjà enregistré (ignoré, idempotent).`);
        return false;
      }
      throw err;
    }
  }

  /**
   * Étape 3 de l'onboarding (fait vérifié n°3b) : abonnement explicite de
   * l'application aux webhooks de CETTE WABA. SANS CETTE ÉTAPE, aucun message
   * n'atteindra jamais notre webhook, même avec un token valide — c'est
   * l'erreur d'intégration WhatsApp la plus fréquente, d'où son log dédié.
   */
  async subscribeAppToWaba(wabaId: string, accessToken: string): Promise<boolean> {
    await this.post<{ success: boolean }>(`/${wabaId}/subscribed_apps`, {}, accessToken);
    return true;
  }

  /**
   * CONTRAINTE N°8 (fait vérifié n°3b) : vérifie que l'app est réellement
   * abonnée aux webhooks de cette WABA après le POST subscribed_apps.
   * Appelé juste après subscribeAppToWaba() pour confirmer l'abonnement
   * avant de marquer isActive=true, et quotidiennement par le cron de
   * surveillance (Meta peut désabonner silencieusement après des échecs).
   *
   * Retourne true si l'app ID figure dans la liste des apps abonnées.
   */
  async verifyWabaSubscription(wabaId: string, accessToken: string): Promise<boolean> {
    const params = new URLSearchParams();
    const res = await this.get<{ data: Array<{ id: string }> }>(
      `/${wabaId}/subscribed_apps`,
      params,
      accessToken,
    );
    const appId = this.config.appId;
    if (!appId) return false;
    return (res.data ?? []).some((app) => app.id === appId);
  }

  /** Infos du numéro (nom validé, qualité) — pour l'affichage dashboard. */
  async getPhoneNumberInfo(phoneNumberId: string, accessToken: string): Promise<PhoneNumberInfo> {
    const params = new URLSearchParams({ fields: 'id,display_phone_number,verified_name,quality_rating' });
    return this.get<PhoneNumberInfo>(`/${phoneNumberId}`, params, accessToken);
  }

  /** Infos d'une Page Facebook — pour le canal Messenger. */
  async getPageInfo(pageId: string, accessToken: string): Promise<PageInfo> {
    const params = new URLSearchParams({ fields: 'id,name,username' });
    return this.get<PageInfo>(`/${pageId}`, params, accessToken);
  }

  /** Liste les numéros de téléphone rattachés à une WABA. */
  async listWabaPhoneNumbers(
    wabaId: string,
    accessToken: string,
  ): Promise<{ data: PhoneNumberInfo[] }> {
    const params = new URLSearchParams({ fields: 'id,display_phone_number,verified_name,quality_rating' });
    return this.get<{ data: PhoneNumberInfo[] }>(`/${wabaId}/phone_numbers`, params, accessToken);
  }

  /** Envoi d'un message texte WhatsApp (réponses du chatbot IA, etc.). */
  async sendWhatsAppText(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    text: string,
  ): Promise<void> {
    await this.post(`/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text.slice(0, 4096) },
    }, accessToken);
  }

  private authHeaders(accessToken: string): Record<string, string> {
    return { Authorization: `Bearer ${accessToken}` };
  }

  /**
   * FAIT VÉRIFIÉ N°15 / CONTRAINTE N°10 — appsecret_proof.
   *
   * Calcule HMAC-SHA256(App Secret, accessToken) en hexadécimal. Ce paramètre
   * doit accompagner TOUS les appels Graph API qui utilisent un token commerçant
   * stocké — il rend le token inutilisable sans l'App Secret, même en cas de
   * fuite du token seul. L'échange du code (exchangeCodeForToken) n'utilise pas
   * de token commerçant → pas de proof requis à cette étape.
   */
  private computeAppsecretProof(accessToken: string): string {
    if (!this.config.appSecret) return '';
    return createHmac('sha256', this.config.appSecret).update(accessToken).digest('hex');
  }

  private async get<T>(path: string, params: URLSearchParams, overrideToken?: string): Promise<T> {
    if (overrideToken) {
      params.set('access_token', overrideToken);
      // Contrainte n°10 : appsecret_proof sur chaque appel Graph avec token commerçant.
      const proof = this.computeAppsecretProof(overrideToken);
      if (proof) params.set('appsecret_proof', proof);
    }
    try {
      const res = await firstValueFrom(
        this.http.get<T>(`${META_GRAPH_BASE_URL}${path}`, { params, timeout: 20000 }),
      );
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string; code?: number } }>;
      const graphCode = axiosErr.response?.data?.error?.code;
      this.logger.error(
        `Graph API ${path} → HTTP ${axiosErr.response?.status ?? '???'} code=${graphCode ?? 'n/a'}`,
      );
      throw err;
    }
  }

  private async post<T>(path: string, body: Record<string, unknown>, accessToken: string): Promise<T> {
    // Contrainte n°10 : appsecret_proof en query param (jamais dans le body).
    const proof = this.computeAppsecretProof(accessToken);
    const queryParams = proof ? `?appsecret_proof=${proof}` : '';
    try {
      const res = await firstValueFrom(
        this.http.post<T>(`${META_GRAPH_BASE_URL}${path}${queryParams}`, body, {
          headers: this.authHeaders(accessToken),
          timeout: 20000,
        }),
      );
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string; code?: number } }>;
      const graphCode = axiosErr.response?.data?.error?.code;
      this.logger.error(
        `Graph API POST ${path} → HTTP ${axiosErr.response?.status ?? '???'} code=${graphCode ?? 'n/a'}`,
      );
      throw err;
    }
  }
}

export interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface DebugTokenData {
  app_id?: string;
  type?: string;
  application?: string;
  data_access_expires_at?: number;
  expires_at?: number;
  is_valid: boolean;
  scopes?: string[];
  granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
}

export interface PhoneNumberInfo {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
}

export interface PageInfo {
  id: string;
  name?: string;
  username?: string;
}

/** Extracteur du couple (code, message, subcode) d'une erreur Graph API. */
export function extractGraphError(err: AxiosError<{ error?: { message?: string; code?: number; error_subcode?: number } }>): {
  code: number | undefined;
  subcode: number | undefined;
  message: string | undefined;
} {
  const graphErr = err.response?.data?.error;
  return {
    code: graphErr?.code,
    subcode: graphErr?.error_subcode,
    message: graphErr?.message ?? err.message,
  };
}
