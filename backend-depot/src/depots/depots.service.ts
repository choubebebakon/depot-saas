import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getDepotLimitForPlan, getSuggestedPlanForPlan } from '../common/plan-limits';

@Injectable()
export class DepotsService {
  constructor(private prisma: PrismaService) { }

  async findAll(tenantId: string) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant requis pour lire les depots.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { planType: true },
      });

      if (!tenant) {
        throw new ForbiddenException('Tenant introuvable.');
      }

      const depotLimit = getDepotLimitForPlan(tenant.planType);

      return tx.depot.findMany({
        where: { tenantId, isArchived: false },
        take: depotLimit === Number.MAX_SAFE_INTEGER ? undefined : depotLimit,
        orderBy: { updatedAt: 'asc' },
        include: {
          _count: {
            select: {
              stocks: true,
              ventes: true,
            },
          },
        },
      });
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.depot.findFirst({
      where: { id, tenantId },
    });
  }

  async create(createDepotDto: any, currentUserTenantId?: string) {
    const tenantId = currentUserTenantId ?? createDepotDto.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant requis pour creer un depot.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { planType: true },
      });

      if (!tenant) {
        throw new ForbiddenException('Tenant introuvable.');
      }

      const depotCount = await tx.depot.count({
        where: { tenantId, isArchived: false },
      });
      const depotLimit = getDepotLimitForPlan(tenant.planType);

      if (depotCount >= depotLimit) {
        throw new ForbiddenException({
          error: 'QUOTA_REACHED',
          message: `Quota de depots atteint pour le plan ${tenant.planType} (${depotCount}/${depotLimit}).`,
          metadata: {
            resource: 'depots',
            currentPlan: tenant.planType,
            suggestedPlan: getSuggestedPlanForPlan(tenant.planType),
            current: depotCount,
            limit: depotLimit,
          },
        });
      }

      return tx.depot.create({
        data: { ...createDepotDto, tenantId },
      });
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
