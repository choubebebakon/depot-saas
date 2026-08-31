import { BadRequestException, Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { DepotBoissonsTourneesEditService } from './tournees-edit.service';

@Controller('depot-boissons/tournees')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
export class DepotBoissonsTourneesEditController {
  constructor(private readonly service: DepotBoissonsTourneesEditService) {}

  @Patch(':id')
  @RequirePermission('tournees', 'write')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    if (!tenantId) throw new BadRequestException('tenantId manquant dans le token.');
    if (!depotId) throw new BadRequestException('Dépôt actif requis.');
    return this.service.update(tenantId, depotId, id, data);
  }
}
