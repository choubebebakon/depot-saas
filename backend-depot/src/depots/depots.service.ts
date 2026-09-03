import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleUser } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  getDepotLimitForPlan,
  getSuggestedPlanForPlan,
} from '../common/plan-limits';

interface DepotUserContext {
  userId: string;
  email: string;
  role: RoleUser | string;
  tenantId: string;
  depotId: string | null;
}

const MANAGER_ROLES = new Set<RoleUser | string>([RoleUser.PATRON, RoleUser.GERANT]);

@Injectable()
export class DepotsService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(user?: DepotUserContext) {
    if (!user?.tenantId) {
      throw new ForbiddenException('Contexte tenant absent.');
    }
    return user.tenantId;
  }

  private requireManager(user?: DepotUserContext) {
    const tenantId = this.requireTenant(user);
    if (!MANAGER_ROLES.has(user?.role ?? '')) {
      throw new ForbiddenException('Droits insuffisants pour gérer les dépôts.');
    }
    return tenantId;
  }

  private canSeeDepot(user: DepotUserContext, depotId: string) {
    return MANAGER_ROLES.has(user.role) || user.depotId === depotId;
  }

  async findAll(user?: DepotUserContext) {
    const tenantId = this.requireTenant(user);
    const isManager = MANAGER_ROLES.has(user?.role ?? '');

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { planType: true },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant introuvable.');
      }

      const depotLimit = getDepotLimitForPlan(tenant.planType);
      const where = isManager
        ? { tenantId, isArchived: false }
        : { tenantId, id: user?.depotId ?? '__NO_DEPOT__', isArchived: false };

      return tx.depot.findMany({
        where,
        take: depotLimit === Number.MAX_SAFE_INTEGER ? undefined : depotLimit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              stocks: true,
              ventes: true,
              users: true,
            },
          },
        },
      });
    });
  }

  async findOne(id: string, user?: DepotUserContext) {
    const tenantId = this.requireTenant(user);
    const depot = await this.prisma.depot.findFirst({
      where: { id, tenantId, isArchived: false },
    });

    if (!depot || !this.canSeeDepot(user as DepotUserContext, id)) {
      throw new NotFoundException('Dépôt introuvable.');
    }

    return depot;
  }

  async create(createDepotDto: {
    nom: string;
    adresse: string;
    emplacement: string;
    codePrefix?: string;
  }, user?: DepotUserContext) {
    const tenantId = this.requireManager(user);

    return this.prisma.$transaction(async (tx) => {
      // Sérialise les créations de dépôts du même tenant afin d'éviter
      // qu'une concurrence ne dépasse le quota du plan.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`depot-quota:${tenantId}`}, 0))`;

      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { planType: true },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant introuvable.');
      }

      const depotCount = await tx.depot.count({
        where: { tenantId, isArchived: false },
      });
      const depotLimit = getDepotLimitForPlan(tenant.planType);

      if (depotCount >= depotLimit) {
        throw new ForbiddenException({
          error: 'QUOTA_REACHED',
          message: `Quota de dépôts atteint pour le plan ${tenant.planType} (${depotCount}/${depotLimit}).`,
          metadata: {
            resource: 'depots',
            currentPlan: tenant.planType,
            suggestedPlan: getSuggestedPlanForPlan(tenant.planType),
            current: depotCount,
            limit: depotLimit,
          },
        });
      }

      try {
        return await tx.depot.create({
          data: {
            nom: createDepotDto.nom.trim(),
            adresse: createDepotDto.adresse.trim(),
            emplacement: createDepotDto.emplacement.trim(),
            codePrefix: createDepotDto.codePrefix?.trim().toUpperCase() || 'DEP',
            tenantId,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('Un dépôt avec ces informations existe déjà.');
        }
        throw error;
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async update(
    id: string,
    updateDepotDto: {
      nom?: string;
      adresse?: string;
      emplacement?: string;
      codePrefix?: string;
      isArchived?: boolean;
    },
    user?: DepotUserContext,
  ) {
    const tenantId = this.requireManager(user);
    const depot = await this.prisma.depot.findFirst({
      where: { id, tenantId },
      select: { id: true, isArchived: true },
    });

    if (!depot) {
      throw new NotFoundException('Dépôt introuvable.');
    }

    if (Object.keys(updateDepotDto).length === 0) {
      throw new BadRequestException('Aucune modification fournie.');
    }

    if (updateDepotDto.isArchived === true && !depot.isArchived) {
      await this.assertCanArchive(id, tenantId);
    }

    return this.prisma.depot.update({
      where: { id },
      data: {
        ...(updateDepotDto.nom !== undefined && { nom: updateDepotDto.nom.trim() }),
        ...(updateDepotDto.adresse !== undefined && { adresse: updateDepotDto.adresse.trim() }),
        ...(updateDepotDto.emplacement !== undefined && { emplacement: updateDepotDto.emplacement.trim() }),
        ...(updateDepotDto.codePrefix !== undefined && {
          codePrefix: updateDepotDto.codePrefix.trim().toUpperCase(),
        }),
        ...(updateDepotDto.isArchived !== undefined && { isArchived: updateDepotDto.isArchived }),
      },
    });
  }

  async remove(id: string, user?: DepotUserContext) {
    const tenantId = this.requireManager(user);
    await this.assertCanArchive(id, tenantId);

    return this.prisma.depot.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  private async assertCanArchive(id: string, tenantId: string) {
    const depot = await this.prisma.depot.findFirst({
      where: { id, tenantId, isArchived: false },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!depot) {
      throw new NotFoundException('Dépôt introuvable ou déjà archivé.');
    }

    if (depot._count.users > 0) {
      throw new ConflictException(
        'Impossible d’archiver ce dépôt tant que des utilisateurs y sont affectés. Réaffectez-les d’abord.',
      );
    }

    const activeCount = await this.prisma.depot.count({
      where: { tenantId, isArchived: false },
    });

    if (activeCount <= 1) {
      throw new ConflictException('Le tenant doit conserver au moins un dépôt actif.');
    }
  }
}
