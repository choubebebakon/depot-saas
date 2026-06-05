import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Ordonnance, NotifType } from '@prisma/client';
import { NotificationsService } from '../../core/notifications/notifications.service';

@Injectable()
export class OrdonnancesService {
  private readonly logger = new Logger(OrdonnancesService.name);
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) {}

  async create(data: any): Promise<Ordonnance> {
    const ordonnance = await this.prisma.ordonnance.create({ data });
    this.notifService.createFromTemplate(
      ordonnance.tenantId,
      NotifType.SYSTEM,
      { message: `Nouvelle ordonnance créée (réf: ${ordonnance.id.slice(0, 8)})` },
    ).catch((e) => this.logger.error(`Erreur notif ordonnance: ${e.message}`));
    return ordonnance;
  }

  async findAll(tenantId: string): Promise<Ordonnance[]> {
    return this.prisma.ordonnance.findMany({ where: { tenantId } });
  }
}
