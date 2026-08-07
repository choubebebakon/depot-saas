import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

const PROVIDER = 'NOTCHPAY';

/**
 * Garantit l'idempotence des webhooks NotchPay.
 * Une référence / eventKey déjà PROCESSED renvoie true sans retraitement.
 */
@Injectable()
export class WebhookIdempotencyService {
  private readonly logger = new Logger(WebhookIdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isAlreadyProcessed(eventKey: string): Promise<boolean> {
    if (!eventKey) return false;

    const existing = await this.prisma.billingWebhookEvent.findFirst({
      where: {
        provider: PROVIDER,
        eventKey,
      },
      select: { id: true, status: true },
    });

    return existing?.status === 'PROCESSED';
  }

  /**
   * Réserve atomiquement l'événement. Retourne false si déjà traité (race-safe).
   */
  async tryReserve(
    eventKey: string,
    input: {
      reference?: string;
      eventType: string;
      payload?: unknown;
    },
  ): Promise<boolean> {
    if (!eventKey) return true;

    try {
      await this.prisma.billingWebhookEvent.create({
        data: {
          eventId: `${PROVIDER}_${eventKey}_${Date.now()}`,
          provider: PROVIDER,
          eventKey,
          reference: input.reference,
          eventType: input.eventType,
          status: 'PROCESSED',
          payload: input.payload as object | undefined,
        },
      });
      return true;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'P2002') {
        this.logger.log(
          `[Idempotence] Événement déjà traité : eventKey=${eventKey}`,
        );
        return false;
      }
      throw error;
    }
  }
}
