import { Controller, Get, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { SitesService } from './sites.service';

@Controller('sites')
@Roles(
  RoleUser.PATRON,
  RoleUser.GERANT,
  RoleUser.CAISSIER,
  RoleUser.COMMERCIAL,
  RoleUser.MAGASINIER,
  RoleUser.COMPTABLE,
)
export class SitesController {
  constructor(private readonly sitesService: SitesService) { }

  @Get()
  findAll(@Query('tenantId') tenantId: string) {
    return this.sitesService.findAll(tenantId);
  }
}
