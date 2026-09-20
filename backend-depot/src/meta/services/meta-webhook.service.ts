import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../prisma.service';
import { MetaIntegrationService } from './meta-integration.service';
import { MetaGraphApiService } from './meta-graph-api.service';
import { SHA256_PREFIX, MAX_WEBHOOK_BODY_BYTES } from '../meta.constants';
import { META_CONFIG } from '../meta.config';
import type { MetaConfig as MetaConfigType } from '../meta.config';
import { Inject } from '@nestjs/common';

/** Enveloppe webhook Meta (faits vérifiés n°6/7) — structure minimale typée. */
export interface MetaWebhookEnvelope {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
          button?: { text?: string };
          interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
        }>;
        statuses?: Array<{ id?: string; status?: string }>;
      };
    }>;
  }>;
}

/**
 * Traitement du webhook Meta — PARTIE 3.
 *
 * FIABILITÉ (fait vérifié n°9) : Meta relivre immédiatement puis à fréquence
 * décroissante pendant 7 jours en cas d'échec, et DÉSABONNE automatiquement
 * l'app après 1h d'échecs continus. Répondre 200 vite est vital : tout le
 * traitement métier (résolution tenant, appel IA, envoi de réponse) est
 * DÉFÉRÉ via une file en mémoire (fire-and-forget), jamais exécuté dans le
 * handler HTTP.
 */
@Injectable()
export class MetaWebhookService {
  private readonly logger = new Logger(MetaWebhookService.name);
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrations: MetaIntegrationService,
    private readonly graph: MetaGraphApiService,
    @Inject(META_CONFIG) private readonly config: MetaConfigType,
  ) {}

  /** Handshake GET (fait vérifié n°6) : challenge en texte clair si token OK. */
  verifyHandshake(hubMode: unknown, hubVerifyToken: unknown, hubChallenge: unknown): string | null {
    if (hubMode !== 'subscribe') return null;
    if (!this.config.verifyToken || typeof hubVerifyToken !== 'string') return null;
    if (hubVerifyToken !== this.config.verifyToken) return null;
    return typeof hubChallenge === 'string' ? hubChallenge : null;
  }

  /**
   * CONTRAINTE N°4 (fait vérifié n°7) : vérification de la signature HMAC
   * SHA-256 SUR LE CORPS BRUT — le buffer doit être celui capturé AVANT tout
   * parsing JSON (main.ts le stocke dans req.rawBody). Calculer le HMAC après
   * le body-parser fait systématiquement échouer la vérification.
   */
  verifySignature(rawBody: Buffer | undefined, header: string | undefined): boolean {
    if (!this.config.appSecret) {
      this.logger.error('META_APP_SECRET manquant : signature webhook non vérifiable (fail closed).');
      return false;
    }
    if (!rawBody || rawBody.length === 0 || rawBody.length > MAX_WEBHOOK_BODY_BYTES) return false;
    if (typeof header !== 'string' || !header.startsWith(SHA256_PREFIX)) return false;
    const expected = createHmac('sha256', this.config.appSecret).update(rawBody).digest('hex');
    const received = header.slice(SHA256_PREFIX.length);
    return safeEquals(expected, received);
  }

  /** Construit la clé d'événement pour la déduplication (contrainte n°7). */
  buildEventKey(envelope: MetaWebhookEnvelope): string {
    const entry = envelope.entry?.[0];
    const change = entry?.changes?.[0];
    const messageId = change?.value?.messages?.[0]?.id ?? change?.value?.statuses?.[0]?.id;
    if (entry?.id && messageId) return `${entry.id}:${messageId}`;
    if (entry?.id && typeof entry.time === 'number') return `${entry.id}:${entry.time}:${change?.field ?? ''}`;
    return '';
  }

  /**
   * Réservation idempotente en base (contrainte n°7). Retourne false si
   * l'événement a déjà été traité (P2002) — Meta re-livre, on ignore.
   */
  async reserveEvent(eventId: string, sourceId: string): Promise<boolean> {
    try {
      await this.prisma.metaWebhookEvent.create({ data: { eventId, sourceId } });
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') return false; // déjà traité
      throw err;
    }
  }

  /**
   * Enfile le traitement asynchrone APRÈS la réponse 200 (contrainte n°3).
   * Fire-and-forget assumé : les erreurs sont loggées, jamais propagées au
   * HTTP. File en mémoire : simple et suffisante tant que le backend est
   * mono-process ; passer à BullMQ/Redis si déploiement multi-instances
   * (documenté dans docs/META_NATIVE_INTEGRATION.md).
   */
  enqueue(envelope: MetaWebhookEnvelope): void {
    const work = this.processEnvelope(envelope)
      .catch((err) => {
        this.logger.error(`meta_webhook_async_error: ${err instanceof Error ? err.message : String(err)}`);
      })
      .finally(() => {
        this.pending.delete(work);
      });
    this.pending.add(work);
  }

  private async processEnvelope(envelope: MetaWebhookEnvelope): Promise<void> {
    for (const entry of envelope.entry ?? []) {
      const source = await this.integrations.resolveWebhookSource(entry.id);
      if (!source) continue; // sécurité : canal non résolu → ignoré (déjà loggé)

      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const inbound = value.messages?.[0];
        if (!inbound) continue; // statuts de livraison et autres événements : ignorés pour l'instant
        const text = inbound.text?.body
          ?? inbound.interactive?.button_reply?.title
          ?? inbound.interactive?.list_reply?.title
          ?? inbound.button?.text
          ?? '';
        if (!text || !inbound.from) continue;

        await this.handleInboundWhatsAppMessage(source.tenantId, source.integrationId, inbound.from, text);
      }
    }
  }

  /** Traitement différé d'un message entrant : contexte tenant + erreur 190. */
  private async handleInboundWhatsAppMessage(
    tenantId: string,
    integrationId: string,
    from: string,
    text: string,
  ): Promise<void> {
    try {
      const credentials = await this.integrations.getCredentials(tenantId, integrationId);
      if (!credentials.phoneNumberId) return;

      // Contexte métier du tenant (isolation : lecture scoping par tenantId).
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { metier: true, nomEntreprise: true, name: true, estActif: true },
      });
      if (!tenant?.estActif) {
        this.logger.warn(`Message WhatsApp ignoré : tenant ${tenantId} inactif.`);
        return;
      }

      this.logger.log(`Message WhatsApp entrant (tenant=${tenantId}) : traitement différé (${text.length} car.).`);

      // Appel IA différé — si GEMINI_API_KEY est configurée, on répond ; sinon
      // on journalise sans répondre (aucun appel inutile à Meta).
      if (!process.env.GEMINI_API_KEY) {
        this.logger.warn('GEMINI_API_KEY absente : message entrant journalisé sans réponse IA.');
        return;
      }
      const reply = await this.askAssistant(tenantId, from, text);
      if (reply) {
        await this.graph.sendWhatsAppText(credentials.phoneNumberId, credentials.accessToken, from, reply);
      }
    } catch (err) {
      const graphCode = (err as { response?: { data?: { error?: { code?: number } } } })?.response?.data?.error?.code;
      if (graphCode === 190) {
        // Token révoqué en runtime → bascule isActive=false (contrainte n°5).
        await this.integrations.markInactive(integrationId, 'Erreur Graph 190 reçue en traitement webhook.');
        return;
      }
      throw err; // remonté au catch de enqueue → log d'erreur
    }
  }

  /**
   * Point d'accroche IA : volontairement minimal et isolé pour rester testable.
   * Le branchement complet au chatbot (catalogue, prompts) est décrit dans
   * docs/META_NATIVE_INTEGRATION.md comme extension prévue — pas d'invention
   * de logique métier non demandée.
   */
  private async askAssistant(tenantId: string, from: string, text: string): Promise<string | null> {
    this.logger.log(`askAssistant stub : tenant=${tenantId} from=…${from.slice(-4)} (${text.length} car.).`);
    return null;
  }
}

/** Comparaison en temps constant des deux hexadécimaux de signature. */
function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
