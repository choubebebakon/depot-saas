import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { LivraisonsService } from './livraisons.service';

@Controller('livraisons')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
export class LivraisonsController {
  constructor(private readonly livraisonsService: LivraisonsService) {}

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.livraisonsService.findOne(id, tenantId, depotId);
  }

  @Post(':id/confirmer')
  confirmer(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
    @CurrentUser() user: any,
  ) {
    return this.livraisonsService.confirmer(id, tenantId, depotId, user);
  }
}
