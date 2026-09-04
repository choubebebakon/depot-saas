import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsAiService } from './ai/notifications-ai.service';
import {
  CreateNotificationDto,
  NotificationFilter,
  UpdatePreferencesDto,
} from './notifications.types';

@Controller('notifications')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class NotificationsController {
  // Empêche deux analyses coûteuses de s'exécuter simultanément pour le même tenant
  // sur une même instance. Le rate-limit HTTP reste la protection principale
  // lorsque plusieurs instances sont déployées.
  private readonly aiRunsInProgress = new Set<string>();
  constructor(
    private readonly notifs: NotificationsService,
    private readonly gateway: NotificationsGateway,
    private readonly ai: NotificationsAiService,
  ) {}

  @Post('ai/run')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async runAiAnalysis(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Contexte entreprise manquant');
    }

    if (this.aiRunsInProgress.has(tenantId)) {
      throw new BadRequestException('Une analyse IA est déjà en cours pour cette entreprise');
    }

    this.aiRunsInProgress.add(tenantId);
    try {
      await this.ai.analyseVentes(tenantId);
      await this.ai.predictRuptures(tenantId);
      return { success: true, message: 'Analyses IA exécutées' };
    } finally {
      this.aiRunsInProgress.delete(tenantId);
    }
  }

  @Get()
  async findAll(@Req() req: any, @Query() filter: NotificationFilter) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notifs.findAll(tenantId, userId, filter);
  }

  @Get('unread')
  async findUnread(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notifs.findUnread(tenantId, userId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notifs.getStats(tenantId, userId);
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notifs.getPreferences(tenantId, userId);
  }

  @Patch('preferences')
  async updatePreferences(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notifs.updatePreferences(tenantId, userId, dto);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    await this.notifs.markAllAsRead(tenantId, userId);
    this.gateway.emitToUser(userId, 'notification:read', { all: true });
    return { success: true };
  }

  @Delete('all')
  async deleteAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    await this.notifs.deleteAll(tenantId, userId);
    this.gateway.emitToUser(userId, 'notification:deleted', { all: true });
    return { success: true };
  }

  @Post('test')
  async createTest(@Req() req: any, @Body() dto: CreateNotificationDto) {
    // Endpoint conservé pour les environnements de développement/staging,
    // mais jamais exposé en production.
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const tenantId = req.user.tenantId;
    return this.notifs.create(tenantId, dto);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.notifs.findById(tenantId, id);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    await this.notifs.markAsRead(tenantId, id, userId);
    this.gateway.emitToUser(userId, 'notification:read', { id });
    return { success: true };
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    await this.notifs.delete(tenantId, id, userId);
    this.gateway.emitToUser(userId, 'notification:deleted', { id });
    return { success: true };
  }
}
