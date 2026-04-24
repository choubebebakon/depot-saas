import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DepotsService {
  constructor(private prisma: PrismaService) { }

  findAll(tenantId: string) {
    return this.prisma.depot.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            stocks: true,
            ventes: true,
          },
        },
      },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.depot.findFirst({
      where: { id, tenantId },
    });
  }

  create(createDepotDto: any) {
    return this.prisma.depot.create({
      data: createDepotDto,
    });
  }

  update(id: string, tenantId: string, updateDepotDto: any) {
    return this.prisma.depot.update({
      where: { id, tenantId },
      data: updateDepotDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const depot = await this.prisma.depot.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            stocks: true,
            ventes: true,
            mouvements: true,
            tournees: true,
          },
        },
      },
    });

    if (!depot) {
      throw new Error('Dépôt introuvable');
    }

    const hasDependencies =
      depot._count.stocks > 0 ||
      depot._count.ventes > 0 ||
      depot._count.mouvements > 0 ||
      depot._count.tournees > 0;

    if (hasDependencies) {
      throw new Error(
        'Impossible de supprimer ce dépôt car il contient des stocks ou un historique de transactions. Veuillez le vider ou le désactiver.',
      );
    }

    return this.prisma.depot.delete({
      where: { id, tenantId },
    });
  }

}
