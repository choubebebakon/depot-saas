import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Medicament, NotifType } from '@prisma/client';
import { NotificationsService } from '../../core/notifications/notifications.service';

@Injectable()
export class MedicamentsService {
  private readonly logger = new Logger(MedicamentsService.name);
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) {}

  async create(data: any): Promise<Medicament> {
    const medicament = await this.prisma.medicament.create({
      data,
      include: { article: true },
    });
    if (medicament.article) {
      const stocks = await this.prisma.stock.findMany({
        where: {
          articleId: medicament.articleId,
          depot: { tenantId: medicament.tenantId },
        },
      });
      for (const stock of stocks) {
        if (stock.quantite <= (stock.seuilCritique || 5)) {
          this.notifService
            .createFromTemplate(medicament.tenantId, NotifType.STOCK_CRITIQUE, {
              articleNom: medicament.article.designation,
              quantite: stock.quantite,
              seuil: stock.seuilCritique || 5,
              articleId: medicament.articleId,
            })
            .catch((e) =>
              this.logger.error(`Erreur notif stock critique: ${e.message}`),
            );
        }
      }
    }
    return medicament;
  }

  async findAll(tenantId: string): Promise<Medicament[]> {
    return this.prisma.medicament.findMany({ where: { tenantId } });
  }
}
