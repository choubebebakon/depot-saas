import { Injectable, OnModuleInit } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import {
  CRM_API_KEY_HEADER,
  CRM_API_KEY_PATTERN,
  CRM_API_KEY_PREFIX,
  CRM_API_KEY_PREFIX_LENGTH,
  CRM_LAST_USED_TOUCH_MS,
  CRM_META_SIGNATURE_HEADER,
  CrmMetaSignatureMode,
} from './crm.constants';
import { crmErrors } from './crm-errors';
import { CrmLogger } from './crm-logger.service';
import type { CrmChannelName } from './crm.types';

/** Identité machine-à-machine résolue depuis `x-api-key`. */
export interface ResolvedCrmKey {
  readonly apiKeyId: string;
  readonly tenantId: string;
  readonly allowedChannels: readonly CrmChannelName[];
  readonly keyPrefix: string;
}

/** Corps brut nécessaire à la vérification de signature Meta. */
interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

/**
 * Résolution de `x-api-key` en tenantId (isolation multi-tenant).
 *
 * Décisions de sécurité :
 *  - La clé brute n'est jamais stockée : on ne conserve qu'une empreinte
 *    HMAC-SHA256 salée par un secret serveur (`CRM_API_KEY_PEPPER`). Un dump de
 *    la base ne permet donc pas de rejouer les clés.
 *  - Le hachage est déterministe à dessein : contrairement à un mot de passe
 *    utilisateur, la clé possède 256 bits d'entropie aléatoire, donc l'attaque
 *    par dictionnaire est inopérante, et un index unique sur `keyHash` permet
 *    une résolution en O(log n) au lieu d'un balayage complet.
 *  - Le format de clé est validé AVANT toute requête : la route ne doit pas
 *    devenir un oracle de test de clés.
 *  - Si le secret serveur est absent en production, le module refuse de servir
 *    (fail closed) plutôt que de comparer des empreintes calculées à vide.
 */
@Injectable()
export class CrmApiKeyService implements OnModuleInit {
  private readonly pepper: string | null;
  private readonly metaAppSecret: string | null;
  private readonly signatureMode: CrmMetaSignatureMode;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CrmLogger,
  ) {
    const envPepper = process.env.CRM_API_KEY_PEPPER?.trim();
    const isProduction = process.env.NODE_ENV === 'production';

    if (envPepper) {
      this.pepper = envPepper;
    } else if (isProduction) {
      // Production sans secret : on marque la configuration comme invalide.
      this.pepper = null;
    } else {
      // Développement : secret éphémère, régénéré à chaque démarrage. Les clés
      // créées lors d'un démarrage précédent ne seront plus résolues — c'est
      // volontaire et journalisé, jamais silencieux.
      this.pepper = randomBytes(32).toString('hex');
    }

    this.metaAppSecret = process.env.META_APP_SECRET?.trim() || null;
    this.signatureMode = this.resolveSignatureMode();
  }

  onModuleInit(): void {
    if (!this.pepper) {
      this.logger.error('crm_api_key_secret_missing', {
        action: 'CRM_NOT_CONFIGURED',
        detail:
          'CRM_API_KEY_PEPPER absent en production : les routes CRM répondront 500 (fail closed).',
      });
    } else if (!process.env.CRM_API_KEY_PEPPER?.trim()) {
      this.logger.warn('crm_api_key_secret_ephemeral', {
        detail:
          'CRM_API_KEY_PEPPER non défini : secret éphémère généré pour ce démarrage (développement uniquement).',
      });
    }

    if (this.signatureMode === CrmMetaSignatureMode.REQUIRED && !this.metaAppSecret) {
      this.logger.error('crm_meta_secret_missing', {
        detail:
          'META_WEBHOOK_SIGNATURE_MODE=required sans META_APP_SECRET : toute requête sera rejetée en 401.',
      });
    }
  }

  /** Génère une clé brute et son empreinte à persister (provisionnement). */
  generateKey(): { raw: string; keyPrefix: string; keyHash: string } {
    const raw = `${CRM_API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
    return {
      raw,
      keyPrefix: raw.slice(0, CRM_API_KEY_PREFIX_LENGTH),
      keyHash: this.hashKey(raw),
    };
  }

  /** Empreinte déterministe d'une clé brute (HMAC-SHA256 + secret serveur). */
  hashKey(rawKey: string): string {
    const pepper = this.pepper;
    if (!pepper) {
      throw crmErrors.notConfigured(
        "Configuration CRM incomplète : CRM_API_KEY_PEPPER doit être défini en production.",
      );
    }

    return createHmac('sha256', pepper).update(rawKey, 'utf8').digest('hex');
  }

  private extractRawKey(request: Request): string | null {
    const header = request.headers?.[CRM_API_KEY_HEADER];
    const candidate = Array.isArray(header) ? header[0] : header;
    if (typeof candidate !== 'string') return null;
    const trimmed = candidate.trim();
    return trimmed === '' ? null : trimmed;
  }

  private resolveSignatureMode(): CrmMetaSignatureMode {
    const raw = process.env.META_WEBHOOK_SIGNATURE_MODE?.trim().toLowerCase();

    if (raw === CrmMetaSignatureMode.OFF) return CrmMetaSignatureMode.OFF;
    if (raw === CrmMetaSignatureMode.REQUIRED) {
      return CrmMetaSignatureMode.REQUIRED;
    }
    // Défaut prudent : on vérifie dès que la signature est présente.
    return CrmMetaSignatureMode.OPTIONAL;
  }

  /**
   * Résout `x-api-key` en tenant. C'est la SEULE source de vérité du tenant :
   * le `shopId` du body n'est jamais utilisé pour filtrer les données.
   */
  async resolve(request: Request, requestId: string): Promise<ResolvedCrmKey> {
    const rawKey = this.extractRawKey(request);

    if (!rawKey) {
      throw crmErrors.unauthorized('En-tête x-api-key manquant.');
    }

    if (!CRM_API_KEY_PATTERN.test(rawKey)) {
      this.logger.warn('crm_api_key_malformed', {
        requestId,
        subject: this.logger.subjectRef(rawKey),
      });
      throw crmErrors.unauthorized("Clé d'API invalide.");
    }

    const keyHash = this.hashKey(rawKey);

    // Projection minimale (jamais d'objet complet) : la résolution reste
    // indexée sur keyHash, donc en O(log n) même avec un grand nombre de clés.
    const stored = await this.prisma.crmApiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        tenantId: true,
        keyHash: true,
        keyPrefix: true,
        isActive: true,
        allowedChannels: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
      },
    });

    // Comparaison à temps constant (défense en profondeur).
    if (!stored || !this.logger.safeEquals(stored.keyHash, keyHash)) {
      this.logger.warn('crm_api_key_unknown', {
        requestId,
        subject: this.logger.subjectRef(rawKey),
      });
      throw crmErrors.unauthorized("Clé d'API inconnue.");
    }

    if (!stored.isActive || stored.revokedAt !== null) {
      this.logger.warn('crm_api_key_revoked', {
        requestId,
        tenantId: stored.tenantId,
        keyPrefix: stored.keyPrefix,
      });
      throw crmErrors.unauthorized("Clé d'API révoquée.");
    }

    if (stored.expiresAt && stored.expiresAt.getTime() <= Date.now()) {
      this.logger.warn('crm_api_key_expired', {
        requestId,
        tenantId: stored.tenantId,
        keyPrefix: stored.keyPrefix,
      });
      throw crmErrors.unauthorized("Clé d'API expirée.");
    }

    this.touchLastUsed(stored.id, stored.lastUsedAt);

    this.logger.info('crm_api_key_resolved', {
      requestId,
      tenantId: stored.tenantId,
      keyPrefix: stored.keyPrefix,
    });

    return {
      apiKeyId: stored.id,
      tenantId: stored.tenantId,
      allowedChannels: stored.allowedChannels,
      keyPrefix: stored.keyPrefix,
    };
  }

  /** Moindre privilège : une clé peut être restreinte à certains canaux. */
  assertChannelAllowed(
    key: ResolvedCrmKey,
    channel: CrmChannelName,
    requestId: string,
  ): void {
    // Liste vide = tous les canaux du tenant (règle documentée sur le modèle).
    if (key.allowedChannels.length === 0) return;

    if (!key.allowedChannels.includes(channel)) {
      this.logger.warn('crm_channel_forbidden', {
        requestId,
        tenantId: key.tenantId,
        channel,
      });
      throw crmErrors.channelForbidden(
        `Cette clé d'API n'est pas autorisée sur le canal ${channel}.`,
      );
    }
  }

  /**
   * Vérifie `X-Hub-Signature-256` (HMAC-SHA256 du corps brut avec META_APP_SECRET).
   *
   * Architecture supposée : le webhook Meta est reçu par l'orchestrateur interne,
   * qui authentifie Meta (signature) puis appelle cette route avec `x-api-key`.
   * Si la route est exposée DIRECTEMENT aux webhooks Meta, il faut définir
   * META_WEBHOOK_SIGNATURE_MODE=required pour que l'appel soit fail closed.
   */
  assertMetaSignature(request: Request, requestId: string): void {
    if (this.signatureMode === CrmMetaSignatureMode.OFF) return;

    const header = request.headers?.[CRM_META_SIGNATURE_HEADER];
    const provided = Array.isArray(header) ? header[0] : header;
    const hasSignature = typeof provided === 'string' && provided.trim() !== '';

    if (!hasSignature) {
      if (this.signatureMode === CrmMetaSignatureMode.REQUIRED) {
        this.logger.warn('crm_meta_signature_missing', { requestId });
        throw crmErrors.unauthorized(
          'Signature Meta (X-Hub-Signature-256) requise sur cette route.',
        );
      }
      // Mode optional : appel interne déjà authentifié par x-api-key.
      return;
    }

    const rawBody = (request as RequestWithRawBody).rawBody;
    const expected =
      this.metaAppSecret && rawBody
        ? `sha256=${createHmac('sha256', this.metaAppSecret)
            .update(rawBody)
            .digest('hex')}`
        : null;

    // Signature fournie mais non vérifiable : on refuse (fail closed) plutôt
    // que de laisser passer un appel dont on ne peut pas prouver l'origine.
    if (!expected) {
      this.logger.error('crm_meta_signature_unverifiable', { requestId });
      throw crmErrors.unauthorized(
        'Signature Meta non vérifiable : configuration serveur incomplète.',
      );
    }

    if (!this.logger.safeEquals(expected, provided.trim())) {
      this.logger.warn('crm_meta_signature_invalid', { requestId });
      throw crmErrors.unauthorized('Signature Meta invalide.');
    }
  }

  /**
   * Provisionne une clé pour un shop. La clé brute n'est retournée qu'UNE fois :
   * elle n'est jamais relisible depuis la base.
   */
  async createApiKey(input: {
    tenantId: string;
    label: string;
    allowedChannels?: readonly CrmChannelName[];
    expiresAt?: Date | null;
  }): Promise<{ id: string; raw: string; keyPrefix: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw crmErrors.validation(
        'Tenant inconnu : impossible de créer une clé CRM.',
      );
    }

    const generated = this.generateKey();

    const created = await this.prisma.crmApiKey.create({
      data: {
        tenantId: input.tenantId,
        label: input.label,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        allowedChannels: [...(input.allowedChannels ?? [])],
        expiresAt: input.expiresAt ?? null,
      },
      select: { id: true },
    });

    this.logger.info('crm_api_key_created', {
      tenantId: input.tenantId,
      keyPrefix: generated.keyPrefix,
    });

    return {
      id: created.id,
      raw: generated.raw,
      keyPrefix: generated.keyPrefix,
    };
  }

  /**
   * Met à jour `lastUsedAt` HORS du chemin critique (fire and forget), et au
   * plus une fois toutes les 5 minutes : cette écriture ne doit pas ajouter de
   * latence à la lecture CRM ni saturer le pool de connexions.
   */
  private touchLastUsed(apiKeyId: string, lastUsedAt: Date | null): void {
    const now = Date.now();
    if (lastUsedAt && now - lastUsedAt.getTime() < CRM_LAST_USED_TOUCH_MS) {
      return;
    }

    void this.prisma.crmApiKey
      .update({ where: { id: apiKeyId }, data: { lastUsedAt: new Date(now) } })
      .catch(() => undefined);
  }
}