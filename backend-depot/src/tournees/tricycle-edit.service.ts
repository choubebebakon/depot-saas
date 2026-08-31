import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TricycleEditService {
  constructor(private readonly prisma: PrismaService) {}

  async update(tenantId: string, depotId: string, id: string, data: any) {
    if (!depotId) throw new BadRequestException('Dépôt actif requis.');
    const nom = String(data?.nom ?? data?.immatriculation ?? '').trim();
    if (!nom) throw new BadRequestException('L’immatriculation est requise.');

    const tricycle = await this.prisma.tricycle.findFirst({ where: { id, tenantId, depotId }, select: { id: true, estLibre: true } });
    if (!tricycle) throw new NotFoundException('Tricycle introuvable dans ce dépôt.');
    if (!tricycle.estLibre) throw new ConflictException('Un tricycle actuellement affecté à une tournée ne peut pas être modifié.');

    const duplicate = await this.prisma.tricycle.findFirst({ where: { tenantId, depotId, nom, NOT: { id } }, select: { id: true } });
    if (duplicate) throw new ConflictException('Cette immatriculation est déjà utilisée dans ce dépôt.');

    return this.prisma.tricycle.update({ where: { id }, data: { nom } });
  }
}
