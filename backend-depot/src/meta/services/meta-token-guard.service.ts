import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetaTokenCryptoService } from './meta-token-crypto.service';
import { MetaGraphApiService, extractGraphError } from './meta-graph-api.service';
import { PrismaService } from '../../prisma.service';
import { META_CONFIG } from '../meta.config';
import type { MetaConfig as MetaConfigType } from '../meta.config';

/**
 * Vérification périodique de validité des tokens — contrainte n°5.
 *
 * Au-delà de la révocation manuelle par le commerçant, un token peut être
 * révoqué côté Meta (mot de passe changé, permissions retirées, expiration du
 * template). Cron horaire : debug_token sur chaque intégration active ; en cas
 * d'erreur Graph 190 ou d'is_valid=false, isActive bascule automatiquement à
 * false. Aucune rotation à date fixe n'est codée : la durée de vie réelle
 * dépend du template Embedded Signup (fait vérifié n°4, à confirmer côté
 * dashboard Meta) — le suivi est fait sur preuve, pas sur hypothèse.
 */
@Injectable()
export class MetaTokenGuardService {
  private readonly logger = new Logger(MetaTokenGuardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: MetaTokenCryptoService,
    private readonly graph: MetaGraphApiService,
    @Inject(META_CONFIG) private readonly config: MetaConfigType,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkAllTokens(): Promise<void> {
    const active = await this.prisma.metaIntegration.findMany({
      where: { isActive: true },
      select: { id: true, tenantId: true, tokenExpiresAt: true, encryptedAccessToken: true },
    });
    if (active.length === 0) return;
    this.logger.log(`Vérification périodique de ${active.length} token(s) Meta…`);

    for (const integration of active) {
      await this.checkOne(integration);
    }
  }

  private async checkOne(integration: {
    id: string;
    tenantId: string;
    tokenExpiresAt: Date | null;
    encryptedAccessToken: string;
  }): Promise<void> {
    // Expiration connue et dépassée → bascule sans appel réseau.
    if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() < Date.now()) {
      await this.prisma.metaIntegration.update({
        where: { id: integration.id },
        data: { isActive: false, lastCheckStatus: 'EXPIRED', lastCheckedAt: new Date(), lastError: 'Token expiré.' },
      });
      this.logger.warn(`Token Meta expiré (tenant=${integration.tenantId}) : intégration désactivée.`);
      return;
    }

    try {
      const blob = this.crypto.decrypt(integration.encryptedAccessToken);
      const debug = await this.graph.debugToken(blob.accessToken);
      if (!debug.is_valid) {
        await this.prisma.metaIntegration.update({
          where: { id: integration.id },
          data: { isActive: false, lastCheckStatus: 'REVOKED', lastCheckedAt: new Date(), lastError: 'Token révoqué côté Meta.' },
        });
        this.logger.warn(`Token Meta révoqué (tenant=${integration.tenantId}) : intégration désactivée.`);
        return;
      }
      await this.prisma.metaIntegration.update({
        where: { id: integration.id },
        data: { lastCheckedAt: new Date(), lastCheckStatus: 'VALID', lastError: null },
      });
    } catch (err) {
      const graphCode = extractGraphError(err as Parameters<typeof extractGraphError>[0]).code;
      if (graphCode === 190) {
        await this.prisma.metaIntegration.update({
          where: { id: integration.id },
          data: { isActive: false, lastCheckStatus: 'REVOKED', lastCheckedAt: new Date(), lastError: 'Erreur Graph 190.' },
        });
        this.logger.warn(`Erreur Graph 190 (tenant=${integration.tenantId}) : intégration désactivée.`);
        return;
      }
      // Échec technique (réseau/config) : on log, on ne bascule pas — le
      // statut courant reste valide jusqu'à preuve du contraire.
      this.logger.error(`Vérification token impossible (tenant=${integration.tenantId}) : ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * CONTRAINTE N°8 — Re-vérification quotidienne des abonnements webhook.
   *
   * Meta peut désabonner silencieusement l'app après 1h d'échecs de livraison
   * (fait vérifié n°9). Ce job détecte l'état réel et ré-abonne si nécessaire,
   * sans attendre une remontée d'erreur webhook.
   */
  @Cron('0 3 * * *')
  async checkAllWebhookSubscriptions(): Promise<void> {
    const integrations = await this.prisma.metaIntegration.findMany({
      where: { isActive: true, channel: 'WHATSAPP', wabaId: { not: null } },
      select: { id: true, tenantId: true, wabaId: true, encryptedAccessToken: true },
    });
    if (integrations.length === 0) return;
    this.logger.log(`Vérification quotidienne abonnements webhook : ${integrations.length} intégration(s)…`);
    for (const integration of integrations) {
      await this.checkOneSubscription(integration);
    }
  }

  private async checkOneSubscription(integration: {
    id: string;
    tenantId: string;
    wabaId: string | null;
    encryptedAccessToken: string;
  }): Promise<void> {
    if (!integration.wabaId) return;
    try {
      const blob = this.crypto.decrypt(integration.encryptedAccessToken);
      const subscribed = await this.graph.verifyWabaSubscription(integration.wabaId, blob.accessToken);
      if (!subscribed) {
        this.logger.warn(`Abonnement webhook perdu pour tenant=${integration.tenantId} waba=${integration.wabaId} — re-souscription…`);
        await this.graph.subscribeAppToWaba(integration.wabaId, blob.accessToken);
        const recheck = await this.graph.verifyWabaSubscription(integration.wabaId, blob.accessToken);
        this.logger.log(`Re-souscription ${recheck ? 'réussie' : 'échouée'} pour tenant=${integration.tenantId}.`);
        await this.prisma.metaIntegration.update({
          where: { id: integration.id },
          data: { webhookSubscriptionVerifiedAt: recheck ? new Date() : null },
        });
      } else {
        await this.prisma.metaIntegration.update({
          where: { id: integration.id },
          data: { webhookSubscriptionVerifiedAt: new Date() },
        });
      }
    } catch (err) {
      this.logger.error(`checkOneSubscription échoué (tenant=${integration.tenantId}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * CONTRAINTE N°9 — Alertes proactives J-7/J-3/J-1 (fait vérifié n°14).
   *
   * Le token BISU 60 jours n'est PAS renouvelable par API : la seule stratégie
   * viable est de prévenir le commerçant à l'avance pour qu'il repasse par
   * l'Embedded Signup. Ce job crée une Notification dashboard pour les tokens
   * expirant dans ≤7 jours.
   */
  @Cron('0 9 * * *')
  async notifyExpiringTokens(): Promise<void> {
    const inSevenDays = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const expiring = await this.prisma.metaIntegration.findMany({
      where: { isActive: true, tokenExpiresAt: { not: null, lte: inSevenDays } },
      select: { id: true, tenantId: true, tokenExpiresAt: true, displayPhoneNumber: true },
    });
    if (expiring.length === 0) return;
    this.logger.log(`${expiring.length} token(s) Meta arrivant à expiration ≤ 7 jours…`);
    for (const integration of expiring) {
      const days = integration.tokenExpiresAt
        ? Math.max(0, Math.ceil((integration.tokenExpiresAt.getTime() - Date.now()) / 86400000))
        : 0;
      try {
        await this.prisma.metaIntegration.update({
          where: { id: integration.id },
          data: { lastCheckStatus: 'EXPIRING_SOON' },
        });

        // Éviter de dupliquer l'alerte si une notification d'expiration a déjà été émise dans les dernières 24h
        const recentNotif = await this.prisma.notification.findFirst({
          where: {
            tenantId: integration.tenantId,
            type: 'META_TOKEN_EXPIRING',
            createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
          },
        });

        if (!recentNotif) {
          await this.prisma.notification.create({
            data: {
              tenantId: integration.tenantId,
              type: 'META_TOKEN_EXPIRING',
              category: 'SYSTEM',
              priority: days <= 1 ? 'CRITICAL' : days <= 3 ? 'HIGH' : 'MEDIUM',
              channel: 'IN_APP',
              title: 'Connexion WhatsApp — renouvellement requis',
              message: `Votre connexion WhatsApp${integration.displayPhoneNumber ? ` (${integration.displayPhoneNumber})` : ''} expire dans ${days} jour(s). Cliquez sur "Connecter WhatsApp Business" dans Paramètres pour la renouveler.`,
              isRead: false,
              isSent: true,
              sentAt: new Date(),
              deliveryStatus: 'DELIVERED',
            },
          });
          this.logger.warn(`Alerte J-${days} envoyée : tenant=${integration.tenantId} integration=${integration.id}`);
        }
      } catch (err) {
        this.logger.error(`notifyExpiringTokens échoué (tenant=${integration.tenantId}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

