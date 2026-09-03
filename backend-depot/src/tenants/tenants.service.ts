import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
        nomEntreprise: createTenantDto.nomEntreprise.trim(),
        emailPatron: createTenantDto.emailPatron.trim().toLowerCase(),
        telephone: createTenantDto.telephone?.trim() || null,
        dateEssaiFin: dateFinEssai,
        dateExpiration: dateFinEssai,
        statutAbonnement: StatutAbonnement.TRIAL,
        estActif: true,
      },
      select: {
        id: true,
        nomEntreprise: true,
        emailPatron: true,
        telephone: true,
        statutAbonnement: true,
        dateEssaiFin: true,
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
        slogan: true,
        adresse: true,
        logo: true,
        messageFin: true,
        metier: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant introuvable.');
    }

    const isManager = TENANT_MANAGERS.has(user.role);
    const depotWhere = isManager
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
        emplacement: true,
        codePrefix: true,
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
      select: {
        id: true,
        nomEntreprise: true,
        emailPatron: true,
        telephone: true,
        slogan: true,
        adresse: true,
        logo: true,
        messageFin: true,
        planType: true,
        statutAbonnement: true,
        estActif: true,
      },
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
      throw new ForbiddenException('Droits insuffisants pour modifier les paramètres.');
    }

    if (Object.keys(updateTenantDto).length === 0) {
      throw new BadRequestException('Aucune modification fournie.');
    }

    const data: Record<string, string | null> = {};

    if (updateTenantDto.nomEntreprise !== undefined) {
      data.nomEntreprise = updateTenantDto.nomEntreprise.trim();
    }
    if (updateTenantDto.telephone !== undefined) {
      data.telephone = updateTenantDto.telephone.trim() || null;
    }
    if (updateTenantDto.slogan !== undefined) {
      data.slogan = updateTenantDto.slogan.trim() || null;
    }
    if (updateTenantDto.adresse !== undefined) {
      data.adresse = updateTenantDto.adresse.trim() || null;
    }
    if (updateTenantDto.messageFin !== undefined) {
      data.messageFin = updateTenantDto.messageFin.trim() || null;
    }
    if (updateTenantDto.logo !== undefined) {
      this.validateLogo(updateTenantDto.logo);
      data.logo = updateTenantDto.logo;
    }

    // Le GERANT peut gérer l'identité commerciale, mais pas l'adresse
    // e-mail de référence du propriétaire. Cette donnée reste PATRON-only.
    if (updateTenantDto.emailPatron !== undefined) {
      if (user.role !== 'PATRON') {
        throw new ForbiddenException('Seul le PATRON peut modifier l’e-mail propriétaire.');
      }
      data.emailPatron = updateTenantDto.emailPatron.trim().toLowerCase();
    }

    return this.prisma.tenant.update({
      where: { id: user.tenantId },
      data,
      select: {
        id: true,
        nomEntreprise: true,
        emailPatron: true,
        telephone: true,
        slogan: true,
        adresse: true,
        logo: true,
        messageFin: true,
        planType: true,
        statutAbonnement: true,
        estActif: true,
      },
    });
  }

  private validateLogo(value: string) {
    if (value.length > 500_000) {
      throw new BadRequestException('Le logo est trop volumineux.');
    }

    const allowedDataUrl = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;
    const allowedHttpUrl = /^https:\/\/[^\s]+$/i;

    if (!allowedDataUrl.test(value) && !allowedHttpUrl.test(value)) {
      throw new BadRequestException('Format de logo non autorisé.');
    }
  }
}
