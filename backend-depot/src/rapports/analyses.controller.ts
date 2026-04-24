import { Controller, Get, Query } from '@nestjs/common';
import { AnalysesService } from './analyses.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { ACCESS_LEVELS } from '../common/utils/rbac';

@Controller('analyses')
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) { }

  @Get('profitabilite')
  @Roles(...ACCESS_LEVELS.GERANT)
  getProfitabilite(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
    @Query('periode') periode?: any,
  ) {
    return this.analysesService.getProfitabilite(tenantId, depotId, periode);
  }

  @Get('rotation')
  @Roles(...ACCESS_LEVELS.GERANT)
  getRotation(@Query('tenantId') tenantId: string, @Query('depotId') depotId: string) {
    return this.analysesService.getRotationStocks(tenantId, depotId);
  }

  @Get('previsions')
  @Roles(...ACCESS_LEVELS.GERANT)
  getPrevisions(@Query('tenantId') tenantId: string, @Query('depotId') depotId: string) {
    return this.analysesService.getPrevisions(tenantId, depotId);
  }
}
