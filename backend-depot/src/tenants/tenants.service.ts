import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { StatutAbonnement } from '@prisma/client';

interface TenantUserContext {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  depotId: string | null;
}

const TENANT_MANAGERS = new Set(['PATRON', 'GERANT']);

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const dateFinEssai = new Date();
    dateFinEssai.setDate(dateFinEssai.getDate() + 30);

    return this.prisma.tenant.create({
      data: {
        nomEntreprise: createTenantDto.nomEntreprise,
        emailPatron: createTenantDto.emailPatron,
        telephone: createTenantDto.telephone,
        dateEssaiFin: dateFinEssai,
        dateExpiration: dateFinEssai,
        statutAbonnement: StatutAbonnement.TRIAL,
        estActif: true,
      },
    });
  }

  async findAll(tenantId?: string) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant requis.');
    }

    return this.prisma.tenant.findMany({
      where: { id: tenantId },
      include: { depots: true },
    });
  }

  /**
   * Retourne uniquement le tenant de l'utilisateur authentifié.
   * Un employé ne reçoit que son dépôt assigné, tandis qu'un PATRON/GERANT
   * peut voir les dépôts actifs de son propre tenant.
   */
  async getInfo(user?: TenantUserContext) {
    if (!user?.tenantId) {
      throw new ForbiddenException('Contexte tenant absent.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        nomEntreprise: true,
        emailPatron: true,
        telephone: true,
        planType: true,
        statutAbonnement: true,
        dateEssaiFin: true,
        dateExpiration: true,
        estActif: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant introuvable.');
    }

    const depotWhere = TENANT_MANAGERS.has(user.role)
      ? { tenantId: user.tenantId, isArchived: false }
      : {
          tenantId: user.tenantId,
          id: user.depotId ?? '__NO_DEPOT__',
          isArchived: false,
        };

    const depots = await this.prisma.depot.findMany({
      where: depotWhere,
      select: {
        id: true,
        nom: true,
        adresse: true,
        telephone: true,
        isArchived: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      tenant,
      depots,
      // Le frontend historique attend les plans en minuscules.
      // L'enum Prisma reste volontairement en majuscules dans `tenant`.
      plan: String(tenant.planType).toLowerCase(),
      currentDepotId: user.depotId ?? null,
    };
  }

  async findOne(id: string, tenantId?: string) {
    if (!tenantId || id !== tenantId) {
      throw new NotFoundException('Tenant introuvable.');
    }

    return this.prisma.tenant.findFirst({
      where: { id: tenantId },
      include: { depots: true },
    });
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
    user?: TenantUserContext,
  ) {
    if (!user?.tenantId || user.tenantId !== id) {
      throw new NotFoundException('Tenant introuvable.');
    }

    if (!TENANT_MANAGERS.has(user.role)) {
      throw new ForbiddenException('Droits insuffisants pour modifier le tenant.');
    }

    return this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: updateTenantDto,
    });
  }
}
