import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MetaGraphApiService, DebugTokenData, PhoneNumberInfo, extractGraphError } from './meta-graph-api.service';
import { MetaTokenCryptoService } from './meta-token-crypto.service';
import { META_CONFIG } from '../meta.config';
import type { MetaConfig as MetaConfigType } from '../meta.config';
import type { MetaChannelType } from '../meta.constants';

/** Vue dashboard d'une intégration — JAMAIS de token, même chiffré, en sortie. */
export interface MetaIntegrationView {
  id: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER';
  wabaId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  facebookPageId: string | null;
  instagramPageId: string | null;
  isActive: boolean;
  tokenExpiresAt: Date | null;
  lastCheckedAt: Date | null;
  lastCheckStatus: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Génération d'un PIN à 6 chiffres pour le « register » d'un numéro WhatsApp. */
function generateRegisterPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Service métier du module Meta natif.
 *
 * ISOLATION MULTI-TENANT (contrainte n°1) : chaque méthode reçoit un tenantId
 * explicite (JWT dashboard) ou le résout depuis l'identifiant de webhook ; il
 * n'existe AUCUN chemin où une donnée d'un tenant atteigne un autre tenant.
 * Les identifiants (phoneNumberId, facebookPageId, instagramPageId) sont
 * uniques GLOBALEMENT : toute tentative de rattacher à son compte un canal
 * déjà connecté à un autre tenant est rejetée en 409 et journalisée.
 */
@Injectable()
export class MetaIntegrationService {
  private readonly logger = new Logger(MetaIntegrationService.name);
  private readonly config: MetaConfigType;

  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: MetaGraphApiService,
    private readonly crypto: MetaTokenCryptoService,
    @Inject(META_CONFIG) config: MetaConfigType,
  ) {
    this.config = config;
  }

  /**
   * PARTIE 2 — Flux de connexion complet, dans l'ordre imposé (contrainte n°6) :
   *   1. échange du code (serveur à serveur, fait vérifié n°2),
   *   2. debug_token pour inspecter les scopes réellement accordés (fait n°5),
   *   3. extraction WABA + numéro de téléphone,
   *   4. enregistrement du numéro (Cloud API, fait n°3a),
   *   5. abonnement de l'app aux webhooks de la WABA (fait n°3b),
   *   5b. vérification GET subscribed_apps (contrainte n°8) — non bloquant,
   *   6. chiffrement AES-256-GCM et persistance (contrainte n°2).
   */
  async connectFromCode(tenantId: string, code: string): Promise<MetaIntegrationView> {
    // ── Étape 1 : échange du code (fait n°1 : le code arrive du frontend, PAS
    // d'une redirection serveur ; l'échange est serveur-à-serveur).
    const tokenRes = await this.graph.exchangeCodeForToken(code);
    const accessToken = tokenRes.access_token;
    if (!accessToken) {
      throw new BadRequestException('Meta n’a pas renvoyé de token pour ce code.');
    }

    // ── Étape 2 : debug_token (fait n°5) — inspecter ce que la connexion
    // accorde RÉELLEMENT plutôt que de supposer les scopes demandés.
    const debug = await this.graph.debugToken(accessToken);
    if (!debug.is_valid) {
      throw new BadRequestException('Le token issu du code est invalide côté Meta.');
    }
    this.assertRequiredScopes(debug);

    // ── Étape 3 : extraction de la WABA depuis les granular scopes.
    const wabaId = this.extractWabaId(debug);
    if (!wabaId) {
      throw new BadRequestException(
        'Aucune WABA accordée à ce token. Vérifiez le template Embedded Signup configuré côté Meta.',
      );
    }

    const phone = await this.getFirstPhoneNumber(wabaId, accessToken);
    const expiresAt = this.resolveTokenExpiry(debug, tokenRes.expires_in);
    const pin = generateRegisterPin();

    // ── Étape 4 : enregistrement du numéro pour la Cloud API (fait n°3a).
    await this.graph.registerPhoneNumber(phone.id, accessToken, pin);

    // ── Étape 5 : abonnement explicite de l'app aux webhooks de CETTE WABA
    // (fait n°3b) — obligatoire : sans lui aucun message n'arrive.
    await this.graph.subscribeAppToWaba(wabaId, accessToken);

    // ── Étape 5b : vérification de l'abonnement (contrainte n°8).
    // Ne bloque PAS si Meta n'a pas encore propagé l'abonnement (asynchronisme
    // possible). En cas d'échec, le cron quotidien re-vérifiera et re-souscrira.
    let webhookSubscriptionVerifiedAt: Date | null = null;
    try {
      const subscribed = await this.graph.verifyWabaSubscription(wabaId, accessToken);
      if (subscribed) {
        webhookSubscriptionVerifiedAt = new Date();
        this.logger.log(`Abonnement webhook WABA ${wabaId} confirmé immédiatement.`);
      } else {
        this.logger.warn(
          `Abonnement webhook WABA ${wabaId} souscrit mais non encore visible (GET) — sera re-vérifié par le cron.`,
        );
      }
    } catch (subErr) {
      this.logger.warn(
        `Vérification d'abonnement WABA échouée (${subErr instanceof Error ? subErr.message : String(subErr)}) — sera re-vérifié par le cron.`,
      );
    }

    // ── Étape 6 : chiffrement puis persistance.
    const encrypted = this.crypto.encrypt({ accessToken, registerPin: pin });

    const existing = await this.prisma.metaIntegration.findUnique({
      where: { phoneNumberId: phone.id },
      select: { id: true, tenantId: true },
    });
    if (existing && existing.tenantId !== tenantId) {
      // SÉCURITÉ : numéro déjà rattaché à un AUTRE tenant → refus strict et
      // journalisé, jamais d'écrasement silencieux (hijack).
      this.logger.error(
        `Tentative de rattachement du numéro ${phone.id} au tenant ${tenantId} alors qu'il appartient au tenant ${existing.tenantId}.`,
      );
      throw new ConflictException('Ce numéro WhatsApp est déjà rattaché à un autre compte GeStock.');
    }

    const saved = existing
      ? await this.prisma.metaIntegration.update({
          where: { id: existing.id },
          data: {
            encryptedAccessToken: encrypted,
            tokenExpiresAt: expiresAt,
            isActive: true,
            lastError: null,
            lastCheckStatus: webhookSubscriptionVerifiedAt ? 'CONNECTED' : 'SUBSCRIPTION_UNVERIFIED',
            lastCheckedAt: new Date(),
            webhookSubscriptionVerifiedAt,
          },
        })
      : await this.prisma.metaIntegration.create({
          data: {
            tenantId,
            channel: 'WHATSAPP',
            wabaId,
            phoneNumberId: phone.id,
            displayPhoneNumber: phone.display_phone_number ?? null,
            encryptedAccessToken: encrypted,
            tokenExpiresAt: expiresAt,
            isActive: true,
            lastCheckStatus: webhookSubscriptionVerifiedAt ? 'CONNECTED' : 'SUBSCRIPTION_UNVERIFIED',
            lastCheckedAt: new Date(),
            webhookSubscriptionVerifiedAt,
          },
        });

    this.logger.log(`Connexion Meta WHATSAPP réussie : tenant=${tenantId} waba=${wabaId} phone=${phone.id}.`);
    return this.toView(saved);
  }

  /** Liste des intégrations DU tenant (isolation : filtre tenantId obligatoire). */
  async listForTenant(tenantId: string): Promise<MetaIntegrationView[]> {
    const rows = await this.prisma.metaIntegration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toView(row));
  }

  /**
   * Vérification de validité via debug_token (fait vérifié n°5, contrainte n°5).
   * Met à jour isActive en base si le token a été révoqué côté Meta (erreur
   * Graph 190) ou s'il a expiré.
   */
  async verifyIntegration(tenantId: string, integrationId: string): Promise<MetaIntegrationView> {
    // ISOLATION : la clause tenantId garantit qu'un commerçant ne peut pas
    // vérifier (ni forcer l'invalidation) l'intégration d'un autre.
    const integration = await this.prisma.metaIntegration.findFirst({
      where: { id: integrationId, tenantId },
    });
    if (!integration) throw new NotFoundException('Intégration Meta introuvable.');

    let status = 'VALID';
    let isActive = integration.isActive;
    let lastError: string | null = null;

    try {
      const blob = this.crypto.decrypt(integration.encryptedAccessToken);
      const debug = await this.graph.debugToken(blob.accessToken);
      if (!debug.is_valid) {
        status = 'REVOKED';
        isActive = false;
        lastError = 'Token révoqué côté Meta (debug_token.is_valid = false).';
      } else {
        const expiry = this.resolveTokenExpiry(debug);
        status = expiry && expiry.getTime() < Date.now() ? 'EXPIRED' : 'VALID';
        if (status === 'EXPIRED') isActive = false;
      }
    } catch (err) {
      const graphCode = extractGraphError(err as Parameters<typeof extractGraphError>[0]).code;
      if (graphCode === 190) {
        // Erreur Graph 190 : token invalide/révoqué/expiré → bascule automatique.
        status = 'REVOKED';
        isActive = false;
        lastError = 'Token révoqué côté Meta (erreur Graph 190).';
      } else {
        // Échec de l'appel (réseau, config) : on NE désactive pas — le statut
        // précédent reste valide jusqu'à preuve du contraire.
        status = 'CHECK_FAILED';
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    const updated = await this.prisma.metaIntegration.update({
      where: { id: integration.id },
      data: { lastCheckedAt: new Date(), lastCheckStatus: status, lastError, isActive },
    });
    return this.toView(updated);
  }

  /**
   * Révocation demandée par le commerçant (contrainte n°5, PARTIE 4) : la ligne
   * est supprimée — plus aucun message ne sera traité pour ce canal. Le
   * commerçant peut en outre révoquer le token dans son dashboard Meta.
   * Isolation : clause tenantId obligatoire.
   */
  async revokeIntegration(tenantId: string, integrationId: string): Promise<void> {
    const integration = await this.prisma.metaIntegration.findFirst({
      where: { id: integrationId, tenantId },
      select: { id: true },
    });
    if (!integration) throw new NotFoundException('Intégration Meta introuvable.');
    await this.prisma.metaIntegration.delete({ where: { id: integration.id } });
    this.logger.warn(`Intégration Meta révoquée : tenant=${tenantId} id=${integrationId}.`);
  }

  /**
   * CONTRAINTE N°1 (fait vérifié n°8) — Résolution webhook → tenant.
   *
   * La signature X-Hub-Signature-256 prouve que l'événement vient de NOTRE app
   * Meta, pas de quel tenant il s'agit. La résolution s'appuie sur des colonnes
   * UNIQUES en base (phoneNumberId / facebookPageId / instagramPageId) : c'est
   * la garantie d'isolation, journalisée — pas un lookup de confort. Retourne
   * null si aucun canal actif ne correspond : le webhook répondra alors 200
   * (fait vérifié n°9 — ne JAMAIS renvoyer 4xx/5xx à Meta, sinon relivres en
   * rafale puis désabonnement automatique après 1h d'échecs continus).
   */
  async resolveWebhookSource(sourceId: string | undefined): Promise<{
    integrationId: string;
    tenantId: string;
    channel: MetaChannelType;
    phoneNumberId: string | null;
  } | null> {
    if (!sourceId) return null;
    const integration = await this.prisma.metaIntegration.findFirst({
      where: {
        isActive: true,
        OR: [
          { phoneNumberId: sourceId },
          { facebookPageId: sourceId },
          { instagramPageId: sourceId },
        ],
      },
      select: { id: true, tenantId: true, channel: true, phoneNumberId: true },
    });
    if (!integration) {
      // Événement de sécurité : canal actif non résolu (tentative ou canal
      // déconnecté). Toujours 200 côté webhook, mais tracé.
      this.logger.warn(`META_TENANT_UNRESOLVED : sourceId=${sourceId} — événement ignoré.`);
      return null;
    }
    return {
      integrationId: integration.id,
      tenantId: integration.tenantId,
      channel: integration.channel as MetaChannelType,
      phoneNumberId: integration.phoneNumberId,
    };
  }

  /** Déchiffre le token d'une intégration ACTIVE du tenant (usage interne : envoi de réponses, vérification). */
  async getCredentials(
    tenantId: string,
    integrationId: string,
  ): Promise<{ accessToken: string; registerPin?: string; phoneNumberId: string | null }> {
    const integration = await this.prisma.metaIntegration.findFirst({
      where: { id: integrationId, tenantId, isActive: true },
    });
    if (!integration) throw new NotFoundException('Intégration Meta active introuvable.');
    const blob = this.crypto.decrypt(integration.encryptedAccessToken);
    return { ...blob, phoneNumberId: integration.phoneNumberId };
  }

  /** Désactive une intégration à la suite d'une erreur Graph 190 détectée en runtime webhook. */
  async markInactive(integrationId: string, reason: string): Promise<void> {
    await this.prisma.metaIntegration.update({
      where: { id: integrationId },
      data: { isActive: false, lastCheckStatus: 'REVOKED', lastError: reason, lastCheckedAt: new Date() },
    });
    this.logger.warn(`Intégration Meta ${integrationId} désactivée automatiquement : ${reason}`);
  }

  // ─── Helpers privés ────────────────────────────────────────────────────────

  /** Extrait l'ID de WABA depuis les granular scopes de debug_token. */
  private extractWabaId(debug: DebugTokenData): string | null {
    const scopes = debug.granular_scopes ?? [];
    for (const scopeName of ['whatsapp_business_management', 'whatsapp_business_messaging']) {
      const match = scopes.find((s) => s.scope === scopeName);
      const id = match?.target_ids?.[0];
      if (id) return id;
    }
    return null;
  }

  /**
   * Récupère le premier numéro de la WABA. Le commerçant ajoute son numéro
   * pendant l'Embedded Signup ; s'il n'y en a aucun, l'onboarding est bloqué
   * avec un message actionnable (pas de création d'une intégration inutilisable).
   */
  private async getFirstPhoneNumber(wabaId: string, accessToken: string): Promise<PhoneNumberInfo> {
    const res = await this.graph.listWabaPhoneNumbers(wabaId, accessToken);
    const phone = res.data?.[0];
    if (!phone?.id) {
      throw new BadRequestException(
        'Aucun numéro de téléphone rattaché à la WABA. Ajoutez d’abord un numéro dans le gestionnaire WhatsApp Business.',
      );
    }
    return phone;
  }

  /**
   * Expire à partir de debug_token.expires_at OU de expires_in renvoyé par
   * l'échange. FAIT VÉRIFIÉ N°4 : la durée n'est PAS garantie à 60 jours —
   * elle dépend du template de configuration Embedded Signup ; elle peut être
   * null (jeton sans expiration). À CONFIRMER dans le dashboard Meta réel.
   */
  private resolveTokenExpiry(debug: DebugTokenData, expiresIn?: number): Date | null {
    if (typeof debug.expires_at === 'number' && debug.expires_at > 0) {
      return new Date(debug.expires_at * 1000);
    }
    if (typeof expiresIn === 'number' && expiresIn > 0) {
      return new Date(Date.now() + expiresIn * 1000);
    }
    return null;
  }

  private assertRequiredScopes(debug: DebugTokenData): void {
    const granted = new Set<string>([
      ...(debug.scopes ?? []),
      ...(debug.granular_scopes ?? []).map((s) => s.scope),
    ]);
    const missing = this.config.requiredScopes.filter((s) => !granted.has(s));
    if (missing.length > 0) {
      this.logger.warn(
        `Scopes Meta manquants : ${missing.join(', ')} — certains appels Graph peuvent échouer. À vérifier dans le dashboard Meta.`,
      );
    }
  }

  /** Projection stricte — aucun champ chiffré ne quitte jamais ce service. */
  private toView(row: {
    id: string;
    channel: string;
    wabaId: string | null;
    phoneNumberId: string | null;
    displayPhoneNumber: string | null;
    facebookPageId: string | null;
    instagramPageId: string | null;
    isActive: boolean;
    tokenExpiresAt: Date | null;
    lastCheckedAt: Date | null;
    lastCheckStatus: string | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): MetaIntegrationView {
    return {
      id: row.id,
      channel: row.channel as MetaIntegrationView['channel'],
      wabaId: row.wabaId,
      phoneNumberId: row.phoneNumberId,
      displayPhoneNumber: row.displayPhoneNumber,
      facebookPageId: row.facebookPageId,
      instagramPageId: row.instagramPageId,
      isActive: row.isActive,
      tokenExpiresAt: row.tokenExpiresAt,
      lastCheckedAt: row.lastCheckedAt,
      lastCheckStatus: row.lastCheckStatus,
      lastError: row.lastError,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

