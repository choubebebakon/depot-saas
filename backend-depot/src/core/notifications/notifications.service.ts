import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotifType, NotifChannel } from '@prisma/client';
import {
  CreateNotificationDto,
  NotificationFilter,
  NotificationStats,
  UpdatePreferencesDto,
} from './notifications.types';
import {
  getTemplate,
  getCategory,
  getPriority,
} from './notifications.templates';
import { ChannelDispatcher } from './channels/channel.dispatcher';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelDispatcher: ChannelDispatcher,
  ) {}

  private buildUserFilter(userId: string | undefined) {
    if (!userId) return {};
    return { OR: [{ userId }, { userId: null as string | null }] };
  }

  async create(tenantId: string, dto: CreateNotificationDto) {
    if (dto.userId) {
      const targetUser = await this.prisma.user.findFirst({
        where: { id: dto.userId, tenantId, isActive: true },
        select: { id: true },
      });
      if (!targetUser) {
        throw new ForbiddenException('Destinataire de notification invalide');
      }
    }

    const tpl =
      dto.title && dto.message
        ? { title: dto.title, message: dto.message }
        : getTemplate(dto.type, dto.metadata || {});

    const data: any = {
      tenantId,
      type: dto.type,
      title: tpl.title,
      message: tpl.message,
      category: dto.category || getCategory(dto.type),
      priority: dto.priority || getPriority(dto.type),
      channel: dto.channel || 'IN_APP',
      actionUrl: dto.actionUrl,
      actionLabel: dto.actionLabel,
      metadata: dto.metadata || {},
      groupKey: dto.groupKey,
      userId: dto.userId,
    };

    let notification: any = null;

    if (dto.groupKey) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          groupKey: dto.groupKey,
          userId: dto.userId ?? null,
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      });
      if (existing) {
        notification = await this.prisma.notification.update({
          where: { id: existing.id },
          data: {
            updatedAt: new Date(),
            ...data,
            createdAt: existing.createdAt,
          },
        });
      }
    }

    if (!notification) {
      notification = await this.prisma.notification.create({ data });
    }

    // La diffusion est volontairement asynchrone : un fournisseur externe
    // indisponible ne doit pas faire échouer la transaction métier.
    this.dispatchRealtime(notification, dto.userId).catch((e) =>
      this.logger.error(
        `Échec dispatch pour notif ${notification.id}: ${(e as Error).message}`,
      ),
    );

    return notification;
  }

  private async dispatchRealtime(
    notification: any,
    userId?: string,
  ): Promise<void> {
    let prefs: {
      emailEnabled?: boolean;
      whatsappEnabled?: boolean;
      pushEnabled?: boolean;
    } = {};

    if (userId) {
      const userPrefs = await this.getPreferences(
        notification.tenantId,
        userId,
      );
      prefs = {
        emailEnabled: userPrefs.emailEnabled,
        whatsappEnabled: userPrefs.whatsappEnabled,
        pushEnabled: userPrefs.pushEnabled,
      };
    }

    await this.channelDispatcher.dispatch(notification, prefs);
  }

  async createBulk(
    tenantId: string,
    dtos: CreateNotificationDto[],
  ): Promise<void> {
    for (const dto of dtos) {
      await this.create(tenantId, dto).catch((e) =>
        this.logger.error(`Bulk create failed: ${e.message}`),
      );
    }
  }

  async createFromTemplate(
    tenantId: string,
    type: NotifType,
    data: Record<string, unknown>,
    userId?: string,
    groupKey?: string,
  ) {
    const tpl = getTemplate(type, data);
    return this.create(tenantId, {
      type,
      title: tpl.title,
      message: tpl.message,
      userId,
      metadata: data,
      groupKey,
    });
  }

  async findAll(tenantId: string, userId: string, filter: NotificationFilter) {
    const and: any[] = [{ tenantId }, this.buildUserFilter(userId)];
    if (filter.isRead !== undefined) and.push({ isRead: filter.isRead });
    if (filter.type) and.push({ type: filter.type });
    if (filter.category) and.push({ category: filter.category });
    if (filter.priority) and.push({ priority: filter.priority });

    if (filter.search) {
      const search = filter.search.trim();
      if (search) {
        and.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (filter.startDate || filter.endDate) {
      const createdAt: Record<string, Date> = {};
      if (filter.startDate) createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) createdAt.lte = new Date(filter.endDate);
      and.push({ createdAt });
    }

    const where: any = { AND: and };
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          AND: [
            { tenantId },
            this.buildUserFilter(userId),
            { isRead: false },
          ],
        },
      }),
    ]);

    return { data, total, unread };
  }

  async findUnread(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: {
        AND: [
          { tenantId },
          this.buildUserFilter(userId),
          { isRead: false },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getStats(tenantId: string, userId: string): Promise<NotificationStats> {
    const userFilter = this.buildUserFilter(userId);
    const [total, unread, critical, high, byCategory, byType] =
      await Promise.all([
        this.prisma.notification.count({ where: { tenantId, ...userFilter } }),
        this.prisma.notification.count({
          where: { tenantId, ...userFilter, isRead: false },
        }),
        this.prisma.notification.count({
          where: { tenantId, ...userFilter, priority: 'CRITICAL' as any },
        }),
        this.prisma.notification.count({
          where: { tenantId, ...userFilter, priority: 'HIGH' as any },
        }),
        this.prisma.notification.groupBy({
          by: ['category'],
          where: { tenantId, ...userFilter },
          _count: true,
        }),
        this.prisma.notification.groupBy({
          by: ['type'],
          where: { tenantId, ...userFilter },
          _count: true,
        }),
      ]);

    return {
      total,
      unread,
      critical,
      high,
      byCategory: Object.fromEntries(
        byCategory.map((c: any) => [c.category, c._count]),
      ),
      byType: Object.fromEntries(byType.map((t: any) => [t.type, t._count])),
    };
  }

  async markAsRead(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<void> {
    await this.assertBelongsToTenant(tenantId, id);
    await this.assertUserHasAccess(userId, id);
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { tenantId, ...this.buildUserFilter(userId), isRead: false },
      data: { isRead: true },
    });
  }

  async delete(tenantId: string, id: string, userId: string): Promise<void> {
    await this.assertBelongsToTenant(tenantId, id);
    await this.assertUserHasAccess(userId, id);
    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteAll(tenantId: string, userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { tenantId, ...this.buildUserFilter(userId) },
    });
  }

  async deleteExpired(): Promise<void> {
    const parsedRetention = Number.parseInt(
      process.env.NOTIF_RETENTION_DAYS || '90',
      10,
    );
    const retentionDays = Number.isFinite(parsedRetention) && parsedRetention > 0
      ? Math.min(parsedRetention, 3650)
      : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(
      `Nettoyage : ${result.count} notifications expirées supprimées`,
    );
  }

  private async assertBelongsToTenant(
    tenantId: string,
    notifId: string,
  ): Promise<void> {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notifId },
      select: { tenantId: true },
    });
    if (!notif) throw new NotFoundException('Notification introuvable');
    if (notif.tenantId !== tenantId)
      throw new ForbiddenException('Accès interdit');
  }

  private async assertUserHasAccess(
    userId: string,
    notifId: string,
  ): Promise<void> {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notifId },
      select: { userId: true },
    });
    if (!notif) throw new NotFoundException('Notification introuvable');
    if (notif.userId && notif.userId !== userId)
      throw new ForbiddenException('Accès interdit');
  }

  async getPreferences(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!user) throw new ForbiddenException('Utilisateur invalide');

    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { tenantId, userId },
      });
    } else if (prefs.tenantId !== tenantId) {
      throw new ForbiddenException('Préférences de notification invalides');
    }
    return prefs;
  }

  async updatePreferences(
    tenantId: string,
    userId: string,
    dto: UpdatePreferencesDto,
  ) {
    const prefs = await this.getPreferences(tenantId, userId);
    return this.prisma.notificationPreference.update({
      where: { id: prefs.id },
      data: {
        ...dto,
        disabledCategories: dto.disabledCategories
          ? JSON.stringify(dto.disabledCategories)
          : undefined,
      },
    });
  }

  async isInSilenceHours(tenantId: string, userId: string): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(tenantId, userId);
      if (!prefs.silenceStart || !prefs.silenceEnd) return false;

      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const current = `${hours}:${minutes}`;

      if (prefs.silenceStart <= prefs.silenceEnd) {
        return current >= prefs.silenceStart && current < prefs.silenceEnd;
      }
      return current >= prefs.silenceStart || current < prefs.silenceEnd;
    } catch {
      return false;
    }
  }

  async isChannelEnabled(
    tenantId: string,
    userId: string,
    channel: NotifChannel,
  ): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(tenantId, userId);
      switch (channel) {
        case 'IN_APP':
          return prefs.inAppEnabled;
        case 'EMAIL':
          return prefs.emailEnabled;
        case 'WHATSAPP':
          return prefs.whatsappEnabled;
        case 'PUSH':
          return prefs.pushEnabled;
        case 'SMS':
          return prefs.smsEnabled;
        default:
          return true;
      }
    } catch {
      return true;
    }
  }

  async findById(tenantId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.tenantId !== tenantId)
      throw new NotFoundException('Notification introuvable');
    return notif;
  }
}
