import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsController } from './notifications.controller';
import { EmailChannel } from './channels/email.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { PushChannel } from './channels/push.channel';
import { ChannelDispatcher } from './channels/channel.dispatcher';
import { NotificationsAiService } from './ai/notifications-ai.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsScheduler,
    EmailChannel,
    WhatsAppChannel,
    PushChannel,
    ChannelDispatcher,
    NotificationsAiService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    ChannelDispatcher,
    NotificationsAiService,
  ],
})
export class NotificationsModule {}
