import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  BillingCycle,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PlanType,
  NotifType,
  StatutAbonnement,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../common/email/email.service';
import { NotchPayService } from './notchpay.service';
import {
  DEFAULT_COUNTRY_ISO2,
  getChannelLimits,
  toE164MomoPhone,
} from '../common/config/notchpay-channels.config';
import { canTransitionTo } from '../common/utils/payment-status.utils';
import { NOTCHPAY_CLIENT_MESSAGES } from './notchpay-failure-policy';
import { NotificationsService } from '../core/notifications/notifications.service';

interface CreatePendingPaymentInput {
  tenantId: string;
  userId?: string;
  planPurchased: PlanType;
  billingCycle: BillingCycle;
  method: PaymentMethod;
  channel?: string;
  customerEmail: string;
  customerName?: string;
  momoPhoneNumber?: string | null;
  /**
   * PARTIE 2 (contrainte 8) : pays ISO 3166-1 alpha-2 du numéro Mobile Money.
   * Optionnel — défaut CM (seul pays confirmé couvert par NotchPay à ce jour).
   */
  country?: string;
  customTotalAmount?: number;
  changeType?: string;
}

// Pricing structure for Site Vitrine subscription plans
const SITE_VITRINE_PRICING = {
  SOLO: 25000,
  PME: 50000,
  ENTERPRISE: 100000,
  TRIAL: 0,
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notchPayService: NotchPayService,
    private readonly emailService: EmailService,
    private readonly notifService: NotificationsService,
  ) {}

  /**
   * Calculate amount based on plan (for Site Vitrine pricing)
   */
  public calculateSiteVitrineAmount(plan: PlanType): number {
    return SITE_VITRINE_PRICING[plan] || 5000;
  }

  public calculateAmount(plan: PlanType, billingCycle: BillingCycle) {
    const PRICING = {
      [PlanType.SOLO]: { monthly: 25000, annual: 249000 },
      [PlanType.PME]: { monthly: 50000, annual: 498000 },
      [PlanType.ENTERPRISE]: { monthly: 100000, annual: 996000 },
      [PlanType.TRIAL]: { monthly: 0, annual: 0 },
    };

    const planPricing = PRICING[plan] || { monthly: 25000, annual: 249000 };
    const amount =
      billingCycle === BillingCycle.MONTHLY
        ? planPricing.monthly
        : planPricing.annual;
    const tvaAmount = Math.round(amount * 0.1925);
    return { amount, tvaAmount, totalAmount: amount + tvaAmount };
  }

  public async createPendingPayment(input: CreatePendingPaymentInput) {
    // ── DÉCOMMISSIONNEMENT STRIPE (PARTIE 1, phase 1 — contraintes 1 à 4) ──
    // Aucun NOUVEAU paiement Stripe n'est créé à partir de cette bascule :
    // - Les lignes Payment { method: STRIPE } historiques restent lisibles et
    //   intactes (audit, facturation, litiges) — la valeur d'enum Prisma est
    //   conservée (les enums Postgres ne se suppriment pas proprement).
    // - Le webhook Stripe (StripeWebhookController) reste ACTIF pendant la
    //   période de grâce pour laisser les paiements en vol se terminer.
    // - Campay : CampayService.collect() n'est appelé par AUCUN flux de
    //   création (vérifié PARTIE 0) — le service ne sert plus qu'à la
    //   reconciliation des PENDING historiques (TasksService / AdminService).
    if (input.method === PaymentMethod.STRIPE) {
      throw new BadRequestException(
        "Le paiement par Stripe n'est plus accepté. Utilisez Mobile Money ou la carte via NotchPay.",
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    const amounts = this.calculateAmount(
      input.planPurchased,
      input.billingCycle,
    );

    // FAIT VALIDÉ n°6 (GET /channels, compte LIVE) : chaque canal impose des
    // limites min/max (MTN/Orange CM : 10 → 500 000 XAF). Un plan annuel
    // PME/ENTERPRISE dépasse le plafond MoMo → NotchPay rejetterait l'init
    // en opaque ; on échoue vite avec un message actionnable. Fail-closed.
    const channelLimits = getChannelLimits(
      input.country ?? DEFAULT_COUNTRY_ISO2,
      input.channel,
    );
    if (
      channelLimits?.maxAmount !== undefined &&
      amounts.totalAmount > channelLimits.maxAmount
    ) {
      throw new BadRequestException(
        `Le montant ${amounts.totalAmount} XAF dépasse le plafond de ${channelLimits.maxAmount} XAF par transaction du canal ${input.channel} (limite NotchPay vérifiée via GET /channels). Choisissez le cycle mensuel ou contactez le support pour activer un canal adapté.`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: input.tenantId,
        amount: amounts.amount,
        totalAmount: amounts.totalAmount,
        status: PaymentStatus.PENDING,
        method: input.method,
        planPurchased: input.planPurchased,
        billingCycle: input.billingCycle,
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    });

    const reference = `GST-${Date.now()}-${payment.id.slice(0, 8)}`;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { reference },
    });

    try {
      // ── FORMAT TÉLÉPHONE STRICT (fait validé par le support NotchPay,
      // 2026-09) : le numéro transmis à NotchPay est TOUJOURS en E.164 avec
      // '+', selon l'opérateur/pays (CM : +2376XXXXXXXX). Unifié pour tous
      // les pays (l'ancien chemin CM-only `normalizePhone` et le chemin
      // "autres pays sans '+'" sont remplacés par un seul format strict).
      // Fail-closed : pays non couvert ou numéro vide → undefined.
      const phone = input.momoPhoneNumber
        ? toE164MomoPhone(input.country, input.momoPhoneNumber)
        : undefined;

      const notchPayResponse = await this.notchPayService.initializePayment({
        amount: amounts.totalAmount,
        currency: 'XAF',
        customer: {
          email: input.customerEmail,
          name: input.customerName ?? tenant.name ?? 'Client',
        },
        phone: phone,
        channel: input.channel,
        // Le verrouillage du canal sur la page hébergée est DÉSACTIVÉ par
        // défaut (NOTCHPAY_LOCK_CHANNEL=false) : mesuré en réel, il fait
        // échouer la page Collect de NotchPay (« Méthode de paiement
        // indisponible ») pour MTN comme pour Orange. Le service ne l'envoie
        // que si la variable vaut 'true'. `lockedCurrency` reste envoyé.
        lockedChannel: input.channel,
        lockedCountry: input.country,
        lockedCurrency: 'XAF',
        // URL de retour facultative (NOTCHPAY_CALLBACK_URL). Non configurée par
        // défaut : sans elle, NotchPay affiche sa propre page de résultat.
        callback: process.env.NOTCHPAY_CALLBACK_URL,
        reference,
        description: `Paiement ${input.planPurchased}`,
      });

      // ── CHAMPS DE RÉPONSE RÉELS (vérifiés en LIVE : HTTP 201) ───────────
      // { status, message, code, transaction: { reference: 'trx.…',
      //   trxref: 'GST-…', status: 'pending' }, authorization_url }
      // → l'URL de paiement est `authorization_url` (et NON `checkout_url`,
      //   qui n'existe pas dans la réponse : le fallback frontend échouait).
      // → l'identifiant NotchPay est `transaction.reference` (préfixe trx.),
      //   utilisé pour rapprocher les webhooks ; `transaction.id` n'existe pas.
      const notchPayId =
        notchPayResponse.transaction?.reference ??
        notchPayResponse.notchPayId ??
        notchPayResponse.transaction?.id;
      const checkoutUrl =
        notchPayResponse.authorization_url ??
        notchPayResponse.checkout_url ??
        notchPayResponse.checkoutUrl;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { notchPayId },
      });

      return {
        ...payment,
        checkout: {
          publicKey: process.env.NOTCHPAY_PUBLIC_KEY,
          paymentId: notchPayId,
          checkoutUrl,
          reference,
          amount: amounts.totalAmount,
          currency: 'XAF',
          channel: input.channel,
          email: input.customerEmail,
          phone: phone,
          description: `Paiement ${input.planPurchased}`,
        },
      };
    } catch (error: any) {
      // ── SÉCURITÉ MESSAGE (message honnête par catégorie) ─────────────────
      // Le message technique brut de NotchPay reste STRICTEMENT dans les logs
      // serveur (ci-dessous + initializePayment). Le commerçant ne reçoit QUE
      // le message mappé par catégorie via notchpay-failure-policy.ts —
      // JAMAIS le brut (l'ancien champ `details` qui l'exposait est supprimé).
      const category = error?.failureCategory ?? 'UNKNOWN';
      const providerMessage = String(error?.providerMessage ?? error?.message);
      this.logger.error(
        `Init paiement échoué [catégorie=${category}] : ${providerMessage}`,
      );
      await this.markPaymentFailed(payment.id);
      this.throwMappedNotchPayInitError(error);
    }
  }

  /**
   * Mappe un échec NotchPay vers une HttpException avec un message CLAIR par
   * catégorie réelle de l'échec (transitoire / numéro invalide / solde
   * insuffisant / annulé-expiré / non catégorisé). Le détail technique brut
   * n'est JAMAIS inclus dans la réponse — il reste en logs serveur.
   * Cas particulier 401 : erreur de configuration (clés) — message dédié.
   */
  private throwMappedNotchPayInitError(error: any): never {
    const category = error?.failureCategory ?? 'UNKNOWN';
    const clientMessage = String(
      error?.clientMessage ?? NOTCHPAY_CLIENT_MESSAGES.UNKNOWN,
    );

    if (error?.providerStatusCode === 401) {
      throw new InternalServerErrorException({
        errorCode: 'NOTCHPAY_CREDENTIALS_INVALID',
        message:
          "Identifiants API NotchPay invalides. Vérifiez NOTCHPAY_PUBLIC_KEY dans la configuration : l'Authorization des endpoints de paiement standard doit porter la CLÉ PUBLIQUE (la clé privée ne sert que le header X-Grant des endpoints à risque).",
      });
    }

    switch (category) {
      case 'TRANSIENT':
        // 503 : l'agrégateur est momentanément indisponible — le commerçant
        // peut réessayer dans quelques minutes (les tentatives auto ont déjà
        // été épuisées côté service).
        throw new ServiceUnavailableException({
          errorCode: 'PAYMENT_PROVIDER_UNAVAILABLE',
          message: clientMessage,
        });
      case 'INVALID_NUMBER':
        throw new BadRequestException({
          errorCode: 'PAYMENT_INVALID_PHONE',
          message: clientMessage,
        });
      case 'INSUFFICIENT_FUNDS':
        throw new BadRequestException({
          errorCode: 'PAYMENT_INSUFFICIENT_FUNDS',
          message: clientMessage,
        });
      case 'ABANDONED':
        throw new BadRequestException({
          errorCode: 'PAYMENT_NOT_FINALIZED',
          message: clientMessage,
        });
      default:
        // Non catégorisé : 502 (échec provider) + message neutre — jamais le brut.
        throw new BadGatewayException({
          errorCode: 'PAYMENT_PROVIDER_ERROR',
          message: clientMessage,
        });
    }
  }

  /**
   * Statut d'un paiement pour le moniteur push Mobile Money (frontend).
   *
   * Rôle : le moniteur d'attente (décompte + relance) scrute ce statut pour
   * détecter la confirmation/échec pendant que le webhook signé NotchPay
   * arrive. Lecture seule : AUCUNE transition d'état ici — l'activation et
   * les changements de statut restent pilotés exclusivement par le webhook
   * signé (contrainte 9) et le cron de reconciliation (pull de sécurité).
   *
   * SÉCURITÉ : appelé avec JWT ; la recherche est scopée au tenant de
   * l'utilisateur (contrainte n°1 d'isolation) — un tenant ne peut pas sonder
   * la référence d'un autre.
   */
  public async getPaymentStatus(reference: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { reference, tenantId },
      select: { reference: true, status: true, method: true },
    });
    if (!payment) {
      throw new NotFoundException('Paiement introuvable.');
    }
    return {
      reference: payment.reference,
      status: payment.status,
      method: payment.method,
    };
  }

  /**
   * Initialize payment for Site Vitrine (simplified pricing structure)
   */
  public async initializeSiteVitrinePayment(input: {
    tenantId: string;
    email: string;
    plan: PlanType;
    amount: number;
    currency: string;
    channel: string;
  }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');

    const reference = `GST-SV-${Date.now()}-${input.tenantId.slice(0, 8)}`;

    try {
      const notchPayResponse = await this.notchPayService.initializePayment({
        amount: input.amount,
        currency: input.currency,
        customer: { email: input.email, name: tenant.name ?? 'Client' },
        channel: input.channel,
        reference,
        description: `Abonnement ${input.plan}`,
        tenantId: input.tenantId,
        plan: input.plan,
      });

      const authorizationUrl =
        notchPayResponse.authorization_url || notchPayResponse.checkout_url;

      return {
        authorization_url: authorizationUrl,
        reference,
        amount: input.amount,
        currency: input.currency,
      };
    } catch (error: any) {
      // Même politique que createPendingPayment : le brut reste en logs
      // serveur, le commerçant ne reçoit que le message mappé par catégorie.
      this.logger.error(
        `Init vitrine échoué [catégorie=${error?.failureCategory ?? 'UNKNOWN'}] : ${error?.providerMessage ?? error?.message}`,
      );
      this.throwMappedNotchPayInitError(error);
    }
  }

  public async markNotchPayComplete(input: {
    reference?: string;
    paymentId?: string;
    notchPayId?: string;
    status: string;
    tenantId?: unknown;
  }): Promise<Payment | null> {
    const status = input.status.toLowerCase();
    // SÉCURITÉ PROD : si AUCUN identifiant n'est fourni, le findFirst Prisma
    // ci-dessous deviendrait un filtre vide (les champs undefined sont ignorés)
    // et pourrait matcher N'IMPORTE QUEL paiement de la table — risquant
    // d'activer l'abonnement du mauvais tenant. Fail-closed obligatoire.
    if (!input.paymentId && !input.reference && !input.notchPayId) {
      this.logger.warn(
        '[Webhook] markNotchPayComplete appelé sans identifiant — rejet fail-closed',
      );
      return null;
    }
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { id: input.paymentId },
          { reference: input.reference },
          { notchPayId: input.notchPayId },
        ],
      },
    });

    if (!payment) return null;

    // IDEMPOTENCE STRICTE (contrainte 10) : vérifier le statut courant AVANT
    // toute mutation. Un paiement déjà finalisé (SUCCESS, COMPLETED historique,
    // REFUNDED) n'est jamais re-traité — un replay de webhook ne doit ni
    // re-prolonger l'abonnement ni écraser un remboursement.
    const targetStatus =
      status === 'complete' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    if (!canTransitionTo(payment.status, targetStatus)) {
      this.logger.log(
        `[Idempotence] Paiement ${payment.id} déjà finalisé (${payment.status}) — no-op webhook`,
      );
      return payment;
    }

    if (status !== 'complete') return await this.markPaymentFailed(payment.id);
    return await this.markPaymentSuccess(
      payment.id,
      input.notchPayId ?? payment.id,
    );
  }

  public async markPaymentFailed(paymentId: string): Promise<Payment> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
      include: {
        tenant: {
          select: {
            name: true,
            emailPatron: true,
            subscriptionStatus: true,
            currentPeriodEnd: true,
            dateExpiration: true,
          },
        },
      },
    });

    // SYNCHRONISATION PROD : la bascule PAST_DUE ne doit toucher que les
    // tenants dont la période est RÉELLEMENT échue. Un échec sur un paiement
    // anticipé (renouvellement en avance) ou sur l'initialisation d'une
    // transaction ne doit JAMAIS dégrader un abonnement encore valide —
    // sinon un simple échec réseau NotchPay passerait des tenants payés en
    // PAST_DUE (puis le dunning en CANCELED au bout de 3 retries).
    const now = new Date();
    const periodEnd =
      payment.tenant?.currentPeriodEnd ?? payment.tenant?.dateExpiration;
    const periodExpired = !periodEnd || periodEnd.getTime() < now.getTime();

    if (
      payment.tenant?.subscriptionStatus === SubscriptionStatus.ACTIVE &&
      periodExpired
    ) {
      await this.prisma.tenant.update({
        where: { id: payment.tenantId },
        data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
      });
    }

    if (payment.tenant?.emailPatron) {
      this.emailService
        .sendPaymentFailed(
          payment.tenant.emailPatron,
          payment.tenant.name || 'Client',
          payment.totalAmount,
          payment.planPurchased as string,
        )
        .catch((err) =>
          this.logger.error(`Erreur email échec paiement: ${err.message}`),
        );
    }

    this.notifService
      .createFromTemplate(payment.tenantId, NotifType.PAYMENT_FAILED, {
        montant: payment.totalAmount,
        raison: 'Transaction refusée',
      })
      .catch((e) =>
        this.logger.error(`Erreur notif échec paiement: ${e.message}`),
      );

    return payment;
  }

  public async markPaymentSuccess(
    paymentId: string,
    transactionId: string,
  ): Promise<Payment> {
    // IDEMPOTENCE STRICTE (contrainte 10) : vérifier le statut courant AVANT
    // toute mutation. Sans cette garde, chaque replay de webhook prolongerait
    // à nouveau l'abonnement (double extension de dateExpiration) et
    // renverrait un email de confirmation à chaque fois.
    const existing = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { status: true },
    });
    if (existing && !canTransitionTo(existing.status, PaymentStatus.SUCCESS)) {
      // Déjà confirmé (SUCCESS / COMPLETED historique) ou remboursé : no-op.
      this.logger.log(
        `[Idempotence] Paiement ${paymentId} déjà finalisé (${existing.status}) — no-op activation`,
      );
      return this.prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: {
          tenant: {
            select: { name: true, emailPatron: true, dateExpiration: true },
          },
        },
      });
    }

    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.SUCCESS, operatorTxId: transactionId },
      include: {
        tenant: {
          select: { name: true, emailPatron: true, dateExpiration: true },
        },
      },
    });

    // FIX #3: Logique de prolongation de l'abonnement en base
    const now = new Date();
    const base =
      payment.tenant.dateExpiration && payment.tenant.dateExpiration > now
        ? payment.tenant.dateExpiration
        : now;

    const nextExp = new Date(base);
    if (payment.billingCycle === BillingCycle.YEARLY) {
      nextExp.setFullYear(nextExp.getFullYear() + 1); // Prolongation d'un an
    } else {
      nextExp.setMonth(nextExp.getMonth() + 1); // Prolongation d'un mois
    }

    await this.prisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        statutAbonnement: StatutAbonnement.ACTIVE,
        planType: payment.planPurchased as PlanType,
        dateExpiration: nextExp,
        subscriptionEnd: nextExp,
        estActif: true,
        graceUntil: null,
        // Champs consolidés (source de vérité pour AccessStatusGuard)
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: nextExp,
        paymentRetryCount: 0,
      },
    });

    if (payment.tenant?.emailPatron) {
      const nextBilling = payment.periodEnd
        ? new Date(payment.periodEnd)
        : undefined;
      this.emailService
        .sendPaymentConfirmation(
          payment.tenant.emailPatron,
          payment.tenant.name || 'Client',
          payment.totalAmount,
          payment.planPurchased as string,
          payment.updatedAt,
          nextBilling,
        )
        .catch((err) =>
          this.logger.error(
            `Erreur email confirmation paiement: ${err.message}`,
          ),
        );
    }

    this.notifService
      .createFromTemplate(payment.tenantId, NotifType.PAYMENT_SUCCESS, {
        montant: payment.totalAmount,
        methode: payment.method,
      })
      .catch((e) => this.logger.error(`Erreur notif paiement: ${e.message}`));

    return payment;
  }

  // ==========================================
  //     HANDLERS DE WEBHOOKS (PHASE 2)
  // ==========================================

  /**
   * Traite les notifications asynchrones envoyées par le Webhook NotchPay standard.
   * Includes signature verification for security.
   */
  public async handleWebhookNotification(
    payload: any,
    signature?: string,
  ): Promise<{ success: boolean; status?: string }> {
    this.logger.log(
      `[Webhook] Notification NotchPay reçue. Événement: ${payload?.event}`,
    );

    // Verify signature if provided
    if (signature) {
      const payloadString = JSON.stringify(payload);
      const isValid = this.notchPayService.verifyWebhookSignature(
        payloadString,
        signature,
      );
      if (!isValid) {
        this.logger.warn(
          '[Webhook] Signature NotchPay invalide - Rejet de la notification',
        );
        throw new BadRequestException('Signature invalide');
      }
      this.logger.log('[Webhook] Signature NotchPay vérifiée avec succès');
    }

    const transaction = payload?.data || payload?.transaction;
    const reference = transaction?.reference;
    const notchPayId = transaction?.id;
    const meta = transaction?.meta || payload?.meta || {};
    const tenantId = meta.tenantId;
    const plan = meta.plan;

    if (!reference && !tenantId) {
      this.logger.warn(
        '[Webhook] Référence et tenantId manquants dans le payload NotchPay',
      );
      throw new BadRequestException('Référence ou tenantId manquant');
    }

    // ── CONTRAINTE 14 — ÉVÉNEMENTS RÉELS NOTCHPAY (orthographe validée
    // depuis le dashboard du compte LIVE, fait validé n°3) ──
    // Terminaux succès  : payment.complete (jamais 'payment.success', qui
    //                     n'existe pas côté NotchPay).
    // Terminaux échec   : payment.failed, payment.cancelled (deux L),
    //                     payment.expired.
    // Intermédiaires    : payment.created, payment.processing,
    //                     payment.partially_pay, payment.authorized,
    //                     payment.captured → journalisés SANS mutater le
    //                     Payment (marquer FAILED un paiement en cours de
    //                     saisie PIN serait une course avec payment.complete).
    // Inconnus          : log + 200 (jamais d'erreur) — contrainte 14.
    const event = String(payload?.event ?? '').toLowerCase();
    const status = String(
      transaction?.status ?? payload?.status ?? '',
    ).toLowerCase();

    const SUCCESS_STATUSES = new Set([
      'complete',
      'accepted',
      'approved',
      'success',
    ]);
    const TERMINAL_FAILURE_EVENTS = new Set([
      'payment.failed',
      'payment.cancelled',
      'payment.expired',
    ]);
    const TERMINAL_FAILURE_STATUSES = new Set([
      'failed',
      'cancelled',
      'canceled',
      'expired',
      'declined',
    ]);
    const INTERMEDIATE_EVENTS = new Set([
      'payment.created',
      'payment.processing',
      'payment.partially_pay',
      'payment.authorized',
      'payment.captured',
    ]);

    const isSuccess =
      SUCCESS_STATUSES.has(status) ||
      (event === 'payment.complete' && !TERMINAL_FAILURE_STATUSES.has(status));
    const isTerminalFailure =
      TERMINAL_FAILURE_EVENTS.has(event) ||
      TERMINAL_FAILURE_STATUSES.has(status);

    // Événements intermédiaires ou inconnus : aucun effet sur le Payment ni
    // sur l'abonnement (contrainte 14) — le 200 évite les retries NotchPay.
    if (!isSuccess && !isTerminalFailure) {
      this.logger.log(
        `[Webhook] Événement '${event || status || 'inconnu'}' sans effet (intermédiaire ou non reconnu) — no-op`,
      );
      return { success: true, status: 'IGNORED_EVENT' };
    }

    // ── PARTIE 5 (contraintes 9/10/11) — CHEMIN CANONIQUE D'ACTIVATION ──
    // L'activation d'abonnement est déclenchée UNIQUEMENT par ce webhook
    // NotchPay signé (jamais par une réponse de formulaire ni un état client).
    // Si une ligne Payment existe pour cette référence (créée par
    // createPendingPayment), on délégue TOUT à markNotchPayComplete →
    // markPaymentSuccess : prolongation selon le billingCycle réel (fix du
    // bug "toujours +1 mois" du chemin direct), reset paymentRetryCount,
    // email de confirmation, notification — le tout idempotent.
    if (isSuccess && reference) {
      const payment = await this.prisma.payment.findFirst({
        where: { reference },
        select: { id: true },
      });
      if (payment) {
        await this.markNotchPayComplete({
          reference,
          notchPayId,
          status: 'complete',
        });
        return { success: true };
      }
    }

    // REPLI (paiements sans ligne Payment — ex. Site Vitrine public) :
    // activation directe depuis les métadonnées NotchPay. Aucun paiement
    // d'abonnement récent ne passe par ici (createPendingPayment crée
    // toujours une ligne Payment référencée GST-…).
    if (tenantId && plan && isSuccess) {
      this.logger.warn(
        `[Webhook] Aucune ligne Payment pour la référence ${reference} — activation directe (repli Site Vitrine) du tenant ${tenantId}`,
      );
      await this.updateTenantSubscription(tenantId, plan as PlanType);
      this.logger.log(
        `[Webhook] Tenant ${tenantId} mis à jour avec le plan ${plan}`,
      );
      return { success: true };
    }

    // Échec terminal (payment.failed / payment.cancelled / payment.expired) :
    // mise à jour du Payment en FAILED. SÉCURITÉ ABONNEMENT (PARTIE 5) :
    // markPaymentFailed ne dégrade JAMAIS un abonnement encore actif
    // (PAST_DUE uniquement si la période est réellement échue) — un échec de
    // paiement ne doit pas couper un merchant déjà à jour par ailleurs.
    const result = await this.markNotchPayComplete({
      reference,
      notchPayId,
      status: 'failed',
    });

    if (!result) {
      // Paiement inconnu de GesTock (ex. transaction Site Vitrine sans ligne,
      // ou référence externe) : on répond 200 pour arrêter les retries
      // NotchPay — une 404 provoquerait une tempête de retries inutile.
      this.logger.warn(
        `[Webhook] Aucun paiement trouvé pour la référence : ${reference} (échec terminal ignoré)`,
      );
      return { success: true, status: 'UNKNOWN_REFERENCE' };
    }

    return { success: true };
  }

  /**
   * REPLI Site Vitrine uniquement (PARTIE 5) : activation directe depuis les
   * métadonnées NotchPay quand AUCUNE ligne Payment n'existe pour la
   * référence. Aucun paiement d'abonnement récent ne passe par ici.
   * Période fixe +1 mois : le Site Vitrine ne vend que du mensuel ; pour tout
   * paiement avec ligne Payment, la prolongation respecte le billingCycle réel
   * (markPaymentSuccess).
   */
  private async updateTenantSubscription(tenantId: string, plan: PlanType) {
    const now = new Date();
    const nextExp = new Date(now);
    nextExp.setMonth(nextExp.getMonth() + 1); // 1 month subscription

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        statutAbonnement: StatutAbonnement.ACTIVE,
        planType: plan,
        dateExpiration: nextExp,
        subscriptionEnd: nextExp,
        estActif: true,
        graceUntil: null,
        // SYNCHRONISATION (PARITÉ AVEC markPaymentSuccess) : le repli Site
        // Vitrine doit mettre à jour LES MÊMES champs consolidés que le
        // chemin canonique, sinon AccessStatusGuard (qui lit
        // subscriptionStatus) laisserait un tenant "bloqué" alors que
        // statutAbonnement/dateExpiration disent ACTIVE.
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: nextExp,
        paymentRetryCount: 0,
      },
    });
  }

  /**
   * Traite les notifications asynchrones envoyées par Campay (MTN / Orange Money).
   */
  public async handleCampayNotification(
    payload: any,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `[Webhook] Notification Campay reçue. Statut: ${payload?.status}`,
    );

    const reference = payload?.reference;
    const transactionId = payload?.id || payload?.transaction_id;
    const status = payload?.status;

    if (!reference) {
      this.logger.warn('[Webhook] Référence manquante dans le payload Campay');
      throw new BadRequestException('Référence manquante');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { reference },
    });

    if (!payment) {
      this.logger.warn(
        `[Webhook] Aucun paiement trouvé pour la référence Campay : ${reference}`,
      );
      throw new NotFoundException('Paiement non trouvé');
    }

    if (status?.toUpperCase() === 'SUCCESSFUL') {
      await this.markPaymentSuccess(
        payment.id,
        transactionId?.toString() || reference,
      );
    } else {
      await this.markPaymentFailed(payment.id);
    }

    return { success: true };
  }
}
