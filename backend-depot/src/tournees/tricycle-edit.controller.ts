import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Metier } from '../auth/decorators/metier.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { MetierGuard } from '../common/guards/metier.guard';
import { MetierType } from '../common/config/metier-roles.config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUser } from '@prisma/client';
import { TricycleEditService } from './tricycle-edit.service';
import { UpdateTricycleDto } from './dto/tournee.dto';

@Controller('tournees/tricycles')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
export class TricycleEditController {
  constructor(private readonly service: TricycleEditService) {}

  @Patch(':id')
  @RequirePermission('tournees', 'write')
  async update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateTricycleDto,
  ) {
    // Le tenant et le dépôt proviennent exclusivement du scope serveur :
    // jamais du body client (protection inter-tenant / inter-dépôt).
    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    return this.service.update(tenantId, depotId, id, data);
  }
}
