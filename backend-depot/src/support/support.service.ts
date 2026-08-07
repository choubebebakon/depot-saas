import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { SupportMessageStatut } from '@prisma/client';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private prisma: PrismaService) {}

  async createMessage(userId: string, tenantId: string | null, dto: CreateSupportDto) {
    const data: any = {
      message: dto.message,
      type: dto.type,
      pageUrl: dto.pageUrl,
      userAgent: dto.userAgent,
    };

    if (userId) {
      data.user = { connect: { id: userId } };
    }

    if (tenantId) {
      data.tenant = { connect: { id: tenantId } };
    }

    this.logger.log(`Creating support message with data: ${JSON.stringify(data)}`);

    const newMessage = await this.prisma.supportMessage.create({
      data,
      include: {
        user: { select: { email: true } },
        tenant: { select: { name: true, metier: true } },
      },
    });

    // Notification asynchrone sans bloquer la réponse
    this.sendWebhookNotification(newMessage).catch((err) =>
      this.logger.error(`Erreur lors de l'envoi du webhook Discord: ${err.message}`)
    );

    return {
      success: true,
      message: "Votre message a bien été enregistré.",
      ticketId: newMessage.id,
    };
  }

  async getMessagesByTenant(tenantId: string) {
    return this.prisma.supportMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });
  }

  async getAllMessages() {
    return this.prisma.supportMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        tenant: { select: { name: true, metier: true } },
      },
    });
  }

  async updateStatut(id: string, statut: SupportMessageStatut) {
    const message = await this.prisma.supportMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message support ${id} introuvable`);
    }

    return this.prisma.supportMessage.update({
      where: { id },
      data: { statut },
    });
  }

  private async sendWebhookNotification(data: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl?.trim()) return;

    const isBug = data.type === 'BUG';
    const tenantInfo = data.tenant?.name
      ? `${data.tenant.name} (${data.tenant.metier || 'N/A'})`
      : 'Support Global';

    const payload = {
      content: `🚨 **Nouveau Ticket Support (${data.type})**`,
      embeds: [
        {
          title: `Locataire : ${tenantInfo}`,
          description: data.message,
          color: isBug ? 16711680 : 3447003,
          fields: [
            { name: '📧 Email de contact', value: `**${data.user?.email || 'Inconnu'}**`, inline: false },
            { name: '👤 Utilisateur', value: data.user?.email || 'Inconnu', inline: true },
            { name: '📄 Page', value: data.pageUrl || 'Non renseignée', inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord API a répondu avec le statut ${response.status}`);
    }
  }
}