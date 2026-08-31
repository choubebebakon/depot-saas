import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUser } from '@prisma/client';
import { TricycleEditService } from './tricycle-edit.service';

@Controller('tournees/tricycles')
@UseGuards(JwtAuthGuard)
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
export class TricycleEditController {
  constructor(private readonly service: TricycleEditService) {}

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    return this.service.update(tenantId, depotId, id, data);
  }
}
