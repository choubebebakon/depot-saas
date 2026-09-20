import { Body, Controller, Get, NotFoundException, Patch, Req, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { RoleUser } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/decorators/audit.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { CRM_SETTINGS_NAMESPACE, CrmSettingsService } from './crm-settings.service';
import { UpdateCrmSettingsDto } from './dto/update-crm-settings.dto';
import type { CrmShopSettings, JsonObject } from './crm.types';

interface AuthenticatedRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    depotId: string | null;
  };
}


@ApiTags('CRM Paramètres')
@Controller('crm-settings')
@UseInterceptors(AuditInterceptor)
export class CrmSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: CrmSettingsService,
  ) {}

  private requireTenant(req: AuthenticatedRequest): string {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new NotFoundException('Tenant introuvable.');
    return tenantId;
  }

  @Get()
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  async get(@Req() req: AuthenticatedRequest): Promise<CrmShopSettings> {
    const tenantId = this.requireTenant(req);
    // Projection minimale : seul `parametres` est lu (contrainte de latence).
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { parametres: true },
    });
    return this.settings.resolve(tenant?.parametres ?? {});
  }

  @Patch()
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @Audit('MODIFICATION_PARAMETRES', 'Tenant')
  async update(
    @Body() dto: UpdateCrmSettingsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CrmShopSettings> {
    const tenantId = this.requireTenant(req);

    await this.prisma.$transaction(async (tx) => {
      // Verrou de ligne : toute autre transaction tentant de fusionner dans
      // `parametres` attend le commit (ou rollback) de celle-ci.
      const locked = await tx.$queryRaw<{ parametres: unknown }[]>(
        Prisma.sql`SELECT "parametres" FROM "Tenant" WHERE "id" = ${tenantId} FOR UPDATE`,
      );
      if (!locked.length) throw new NotFoundException('Tenant introuvable.');

      const currentRoot = this.asObject(locked[0].parametres);
      const mergedRoot: JsonObject = {
        ...currentRoot,
        [CRM_SETTINGS_NAMESPACE]: {
          ...this.asObject(currentRoot[CRM_SETTINGS_NAMESPACE]),
          ...this.toNamespacePatch(dto),
        },
      };

      await tx.tenant.update({
        where: { id: tenantId },
        data: { parametres: mergedRoot as Prisma.InputJsonValue },
      });
    });

    const refreshed = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { parametres: true },
    });
    return this.settings.resolve(refreshed?.parametres ?? {});
  }

  /** Convertit le DTO aplati en patch du namespace `crm` (champs transmis uniquement). */
  private toNamespacePatch(dto: UpdateCrmSettingsDto): JsonObject {
    const patch: JsonObject = {};

    const channels: JsonObject = {};
    if (dto.channelsWhatsapp !== undefined) channels.whatsapp = dto.channelsWhatsapp;
    if (dto.channelsInstagram !== undefined) channels.instagram = dto.channelsInstagram;
    if (dto.channelsMessenger !== undefined) channels.messenger = dto.channelsMessenger;
    if (Object.keys(channels).length) patch.channels = channels;

    const loyalty: JsonObject = {};
    if (dto.loyaltyEnabled !== undefined) loyalty.enabled = dto.loyaltyEnabled;
    if (dto.loyaltyPointsPerCurrencyUnit !== undefined)
      loyalty.pointsPerCurrencyUnit = dto.loyaltyPointsPerCurrencyUnit;
    if (dto.loyaltyPointsToCurrencyRatio !== undefined)
      loyalty.pointsToCurrencyRatio = dto.loyaltyPointsToCurrencyRatio;
    if (dto.loyaltyCurrency !== undefined)
      loyalty.currency = dto.loyaltyCurrency.trim() === '' ? null : dto.loyaltyCurrency.trim().toUpperCase();
    if (Object.keys(loyalty).length) patch.loyalty = loyalty;

    const shrinkage: JsonObject = {};
    if (dto.shrinkageEnabled !== undefined) shrinkage.enabled = dto.shrinkageEnabled;
    if (dto.shrinkageMaxDeltaPercent !== undefined)
      shrinkage.maxDeltaPercent = dto.shrinkageMaxDeltaPercent;
    if (dto.shrinkageWindowDays !== undefined)
      shrinkage.windowDays = dto.shrinkageWindowDays;
    if (Object.keys(shrinkage).length) patch.shrinkageAlert = shrinkage;

    if (dto.boutiqueSizeSystem !== undefined)
      patch.boutique = {
        sizeSystem: dto.boutiqueSizeSystem === '' ? null : dto.boutiqueSizeSystem,
      };

    if (dto.historyDefaultLimit !== undefined)
      patch.history = { defaultLimit: dto.historyDefaultLimit };

    if (dto.metaDataAppendPaths !== undefined) {
      const paths = dto.metaDataAppendPaths
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p !== '');
      patch.metaData = { appendPaths: paths };
    }

    return patch;
  }

  private asObject(value: unknown): JsonObject {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as JsonObject;
  }
}
