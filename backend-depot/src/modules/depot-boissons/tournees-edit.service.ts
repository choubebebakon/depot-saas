import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DepotBoissonsTourneesEditService {
  constructor(private readonly prisma: PrismaService) {}

  async update(tenantId: string, depotId: string, id: string, data: any) {
    if (!depotId) throw new BadRequestException('Dépôt actif requis.');
    if (!data?.tricycleId || !data?.commercialId || !data?.date) {
      throw new BadRequestException('tricycleId, commercialId et date sont requis.');
    }

    const tournee = await this.prisma.tournee.findFirst({
      where: { id, tenantId, depotId },
      select: { id: true, statut: true },
    });
    if (!tournee) throw new NotFoundException('Tournée introuvable dans ce dépôt.');
    if (tournee.statut !== 'PLANIFIEE') {
      throw new ConflictException('Une tournée déjà démarrée ou clôturée ne peut plus être modifiée.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tricycle = await tx.tricycle.findFirst({
        where: { id: data.tricycleId, tenantId, depotId },
        select: { id: true, estLibre: true },
      });
      if (!tricycle) throw new BadRequestException('Tricycle introuvable dans ce dépôt.');
      if (!tricycle.estLibre) throw new ConflictException('Ce tricycle est déjà affecté à une tournée.');

      const commercial = await tx.user.findFirst({
        where: { id: data.commercialId, tenantId, depotId },
        select: { id: true },
      });
      if (!commercial) throw new BadRequestException('Commercial introuvable dans ce dépôt.');

      return tx.tournee.update({
        where: { id },
        data: {
          tricycleId: data.tricycleId,
          commercialId: data.commercialId,
          dateOuverture: new Date(data.date),
        },
        include: {
          tricycle: true,
          commercial: { select: { email: true, role: true, nom: true } },
          depot: true,
        },
      });
    }, { isolationLevel: 'Serializable' });
  }
}
