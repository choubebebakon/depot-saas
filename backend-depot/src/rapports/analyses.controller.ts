import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { AnalysesService } from './analyses.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { ACCESS_LEVELS } from '../common/utils/rbac';
import { RoleUser } from '@prisma/client';

@Controller('analyses')
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  private resolveScope(req: any, queryDepotId?: string): { tenantId: string; depotId?: string } {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Contexte tenant introuvable.');
    }

    const isPatron =
      req.user?.role === RoleUser.PATRON || req.user?.role === 'PATRON';

    if (isPatron) {
      return { tenantId, depotId: queryDepotId || req.user?.depotId || undefined };
    }

    const depotId = req.user?.depotId;
    if (!depotId) {
      throw new ForbiddenException('Cet utilisateur n’est affecté à aucun dépôt.');
    }

    return { tenantId, depotId };
  }

  @Get('profitabilite')
  @Roles(...ACCESS_LEVELS.GERANT)
  getProfitabilite(
    @Req() req: any,
    @Query('depotId') depotId?: string,
    @Query('periode') periode?: any,
  ) {
    const scope = this.resolveScope(req, depotId);
    return this.analysesService.getProfitabilite(
      scope.tenantId,
      scope.depotId,
      periode,
    );
  }

  @Get('rotation')
  @Roles(...ACCESS_LEVELS.GERANT)
  getRotation(@Req() req: any, @Query('depotId') depotId?: string) {
    const scope = this.resolveScope(req, depotId);
    return this.analysesService.getRotationStocks(
      scope.tenantId,
      scope.depotId,
    );
  }

  @Get('previsions')
  @Roles(...ACCESS_LEVELS.GERANT)
  getPrevisions(@Req() req: any, @Query('depotId') depotId?: string) {
    const scope = this.resolveScope(req, depotId);
    return this.analysesService.getPrevisions(
      scope.tenantId,
      scope.depotId,
    );
  }
}
