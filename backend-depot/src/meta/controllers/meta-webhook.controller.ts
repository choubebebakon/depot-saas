import { Controller, Get, HttpStatus, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { MetaWebhookService, MetaWebhookEnvelope } from '../services/meta-webhook.service';
import { META_SIGNATURE_HEADER, META_INVALID_SIGNATURE_MESSAGE, MAX_WEBHOOK_BODY_BYTES } from '../meta.constants';

/**
 * Webhook Meta unique — PARTIE 3.
 *
 * Endpoints publics (Meta ne s'authentifie pas avec notre JWT) :
 *  - GET  /api/v1/meta/webhook  : handshake (fait vérifié n°6)
 *  - POST /api/v1/meta/webhook  : notifications signées (fait vérifié n°7)
 *
 * FIABILITÉ (fait vérifié n°9) : le handler répond 200 IMMÉDIATEMENT après la
 * vérification de signature et la réservation idempotente ; le traitement
 * métier (résolution tenant, catalogue, IA) est en file asynchrone. Ne JAMAIS
 * répondre 4xx/5xx à un événement valide : Meta relivrerait en rafale puis
 * désabonnerait l'app après 1h d'échecs.
 */
@ApiTags('Meta Webhook')
@Controller('meta')
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);

  constructor(private readonly webhook: MetaWebhookService) {}

  /** Handshake de vérification — répond hub.challenge en texte brut, sinon 403. */
  @Get('webhook')
  @Public()
  handshake(
    @Query('hub.mode') hubMode: unknown,
    @Query('hub.verify_token') hubVerifyToken: unknown,
    @Query('hub.challenge') hubChallenge: unknown,
    @Res() res: Response,
  ): void {
    const challenge = this.webhook.verifyHandshake(hubMode, hubVerifyToken, hubChallenge);
    if (challenge === null) {
      // 403 sans détail : un attaquant ne doit pas apprendre pourquoi.
      res.status(HttpStatus.FORBIDDEN).send('Forbidden');
      return;
    }
    res.status(HttpStatus.OK).type('text/plain').send(challenge);
  }

  /** Notifications signées — 200 immédiat, traitement différé. */
  @Post('webhook')
  @Public()
  async receive(@Req() req: Request, @Res() res: Response): Promise<void> {
    // CORPS BRUT (contrainte n°4) : req.rawBody est capturé par le `verify`
    // du body-parser dans main.ts, AVANT tout parsing JSON.
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.headers[META_SIGNATURE_HEADER];

    if (!this.webhook.verifySignature(rawBody, Array.isArray(signature) ? signature[0] : signature)) {
      this.logger.warn('meta_webhook_signature_rejected');
      res.status(HttpStatus.UNAUTHORIZED).send(META_INVALID_SIGNATURE_MESSAGE);
      return;
    }

    let envelope: MetaWebhookEnvelope;
    try {
      envelope = JSON.parse(rawBody!.toString('utf8')) as MetaWebhookEnvelope;
    } catch {
      res.status(HttpStatus.BAD_REQUEST).send();
      return;
    }

    // Déduplication (contrainte n°7) : réservation atomique avant réponse.
    // En cas d'erreur DB on répond TOUT DE MÊME 200 (fait vérifié n°9 : ne
    // jamais faire retourner à Meta en rafale) et l'événement est traité —
    // le risque de doublon est préféré à la perte.
    const eventKey = this.webhook.buildEventKey(envelope);
    let shouldProcess = true;
    if (eventKey) {
      try {
        shouldProcess = await this.webhook.reserveEvent(eventKey, envelope.entry?.[0]?.id ?? 'unknown');
      } catch (err) {
        this.logger.error(`meta_webhook_dedup_error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    res.status(HttpStatus.OK).json({ received: true });

    if (shouldProcess) {
      // Traitement différé — JAMAIS await ici (contrainte n°3).
      this.webhook.enqueue(envelope);
    } else {
      this.logger.log(`meta_webhook_duplicate_ignored: ${eventKey}`);
    }
  }
}

// Réexport pour lisibilité : borne de taille du corps brut.
export const META_MAX_WEBHOOK_BODY_BYTES = MAX_WEBHOOK_BODY_BYTES;
