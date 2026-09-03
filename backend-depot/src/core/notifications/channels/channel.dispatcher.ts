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

    // Un canal externe doit être explicitement demandé par la notification.
    // Cela évite qu'une notification IN_APP déclenche par erreur WhatsApp/email/push.
    if (!notif.userId && notif.channel !== 'IN_APP') {
      await this.handleFailure(
        notif,
        notif.channel,
        new Error('Un destinataire utilisateur est requis pour ce canal'),
      );
      return;
    }

    if (notif.channel === 'EMAIL' && prefs.emailEnabled && notif.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: notif.userId, tenantId: notif.tenantId, isActive: true },
        select: { email: true },
      });

      if (!user?.email) {
        await this.handleFailure(
          notif,
          'EMAIL',
          new Error('Adresse email utilisateur absente'),
        );
      } else {
        promises.push(
          this.email
            .sendTemplate(user.email, notif.type as any, {
              title: notif.title,
              message: notif.message,
            })
            .then((ok) => {
              if (ok === false) throw new Error('Le canal email a refusé la livraison');
              return ok;
            })
            .catch((e) => this.handleFailure(notif, 'EMAIL', e)),
        );
      }
    }

    if (notif.channel === 'WHATSAPP' && prefs.whatsappEnabled && notif.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: notif.userId, tenantId: notif.tenantId, isActive: true },
        select: { telephone: true },
      });

      if (!user?.telephone) {
        await this.handleFailure(
          notif,
          'WHATSAPP',
          new Error('Numéro de téléphone utilisateur absent'),
        );
      } else {
        const message = `${notif.title}\n\n${notif.message}`;
        promises.push(
          this.whatsapp
            .send(user.telephone, message)
            .then((ok) => {
              if (ok === false) throw new Error('Le canal WhatsApp a refusé la livraison');
              return ok;
            })
            .catch((e) => this.handleFailure(notif, 'WHATSAPP', e)),
        );
      }
    }

    if (notif.channel === 'PUSH' && prefs.pushEnabled && notif.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: notif.userId, tenantId: notif.tenantId, isActive: true },
        select: { preferences: true },
      });
      const preferences =
        user?.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences)
          ? (user.preferences as Record<string, unknown>)
          : {};
      const token = typeof preferences.pushToken === 'string' ? preferences.pushToken.trim() : '';

      if (!token) {
        await this.handleFailure(
          notif,
          'PUSH',
          new Error('Token push utilisateur absent'),
        );
      } else {
        promises.push(
          this.push
            .sendToDevice(token, notif.title, notif.message || '')
            .then((ok) => {
              if (ok === false) throw new Error('Le canal push a refusé la livraison');
              return ok;
            })
            .catch((e) => this.handleFailure(notif, 'PUSH', e)),
        );
      }
    }

    if (promises.length === 0) {
      // IN_APP est considéré livré lorsque l'événement a été émis vers le bus WS.
      // Pour un canal externe désactivé par les préférences, on ne prétend pas
      // qu'il a été livré : la notification reste disponible dans l'application.
      if (notif.channel === 'IN_APP') {
        await this.markDelivered(notif);
      }
      return;
    }

    const results = await Promise.allSettled(promises);
    const allSuccess = results.every((r) => r.status === 'fulfilled');
    if (allSuccess) await this.markDelivered(notif);
  }

  private async markDelivered(notif: Notification): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notif.id },
      data: {
        deliveryStatus: 'DELIVERED' as any,
        isSent: true,
        sentAt: new Date(),
      },
    });
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
