import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { NotificationsGateway } from '../notifications.gateway';
import { EmailChannel } from './email.channel';
import { WhatsAppChannel } from './whatsapp.channel';
import { PushChannel } from './push.channel';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class ChannelDispatcher {
  private readonly logger = new Logger(ChannelDispatcher.name);

  constructor(
    private readonly email: EmailChannel,
    private readonly whatsapp: WhatsAppChannel,
    private readonly push: PushChannel,
    private readonly gateway: NotificationsGateway,
    private readonly prisma: PrismaService,
  ) {}

  async dispatch(
    notif: Notification,
    prefs: {
      emailEnabled?: boolean;
      whatsappEnabled?: boolean;
      pushEnabled?: boolean;
    },
  ): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (notif.userId) {
      this.gateway.emitToUser(notif.userId, 'notification:new', notif);
    } else {
      this.gateway.emitToTenant(notif.tenantId, 'notification:new', notif);
    }

    if (prefs.emailEnabled && notif.channel === 'EMAIL') {
      promises.push(
        this.email
          .sendTemplate('', notif.type as any, {
            title: notif.title,
            message: notif.message,
          })
          .catch((e) => this.handleFailure(notif, 'EMAIL', e)),
      );
    }

    if (prefs.whatsappEnabled) {
      const message = `${notif.title}\n\n${notif.message}`;
      promises.push(
        this.whatsapp
          .send('', message)
          .catch((e) => this.handleFailure(notif, 'WHATSAPP', e)),
      );
    }

    if (prefs.pushEnabled && notif.title) {
      promises.push(
        this.push
          .sendToDevice('', notif.title, notif.message || '')
          .catch((e) => this.handleFailure(notif, 'PUSH', e)),
      );
    }

    const results = await Promise.allSettled(promises);

    const allSuccess = results.every((r) => r.status === 'fulfilled');
    if (allSuccess) {
      await this.prisma.notification.update({
        where: { id: notif.id },
        data: {
          deliveryStatus: 'DELIVERED' as any,
          isSent: true,
          sentAt: new Date(),
        },
      });
    }
  }

  private async handleFailure(
    notif: Notification,
    channel: string,
    error: Error,
  ): Promise<void> {
    this.logger.error(
      `Échec canal ${channel} pour notif ${notif.id}: ${error.message}`,
    );
    await this.prisma.notification.update({
      where: { id: notif.id },
      data: {
        retryCount: { increment: 1 },
        deliveryStatus: 'FAILED' as any,
      },
    });
  }
}
