import { Controller, Get, Req } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { RapportsService } from './rapports.service';

interface AuthenticatedRequest {
  user?: {
    userId?: string;
    email?: string;
    role?: RoleUser;
    tenantId?: string;
    depotId?: string | null;
  };
  headers: Record<string, string | string[] | undefined>;
}

@Controller('rapports')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.COMPTABLE)
export class RapportsController {
  constructor(private readonly rapportsService: RapportsService) {}

  @Get('top-produits-marge')
  // §10 — rapport financier (marge) : réservé aux rôles autorisés sur
  // le sous-module « rapports » (PATRON/GERANT en code, COMPTABLE seedé).
  @RequirePermission('rapports', 'read')
  getTopProduitsParMarge(@Req() req: AuthenticatedRequest) {
    return this.rapportsService.getTopProduitsParMarge(
      req.user,
      this.getRequestedDepotId(req),
      this.getMonth(req),
    );
  }

  @Get('performance-commerciaux')
  // §10 — « Mes performances » : le COMMERCIAL accède à ce rapport mais le
  // service le limite à sa propre ligne (self-scope serveur, §7).
  @Roles(
    RoleUser.PATRON,
    RoleUser.GERANT,
    RoleUser.COMPTABLE,
    RoleUser.COMMERCIAL,
  )
  @RequirePermission('rapports_performance', 'read')
  getPerformanceCommerciaux(@Req() req: AuthenticatedRequest) {
    return this.rapportsService.getPerformanceCommerciaux(
      req.user,
      this.getRequestedDepotId(req),
      this.getMonth(req),
    );
  }

  @Get('point-mort')
  // §10 — rapport financier (seuil de rentabilité).
  @RequirePermission('rapports', 'read')
  getPointMortMensuel(@Req() req: AuthenticatedRequest) {
    return this.rapportsService.getPointMortMensuel(
      req.user,
      this.getRequestedDepotId(req),
      this.getMonth(req),
    );
  }

  private getRequestedDepotId(req: AuthenticatedRequest): string | undefined {
    const value = req.headers['x-depot-id'];
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return typeof value === 'string' ? value.trim() || undefined : undefined;
  }

  private getMonth(req: AuthenticatedRequest): string | undefined {
    const value = req.headers['x-report-month'];
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return typeof value === 'string' ? value.trim() || undefined : undefined;
  }
}
