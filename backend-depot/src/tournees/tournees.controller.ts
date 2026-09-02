import { Body, Controller, Get, GoneException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Metier } from '../auth/decorators/metier.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { MetierGuard } from '../common/guards/metier.guard';
import { MetierType } from '../common/config/metier-roles.config';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTricycleDto } from './dto/tournee.dto';
import { TourneesService } from './tournees.service';

@Controller('tournees')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
export class TourneesController {
  constructor(private readonly service: TourneesService) {}

  private scope(req: any) {
    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    if (!tenantId) throw new GoneException('Contexte tenant absent.');
    if (!depotId) throw new GoneException('Dépôt actif requis.');
    return { tenantId, depotId };
  }

  @Post('tricycles')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  @RequirePermission('tournees', 'write')
  createTricycle(@Req() req: any, @Body() dto: CreateTricycleDto) {
    const { tenantId, depotId } = this.scope(req);
    return this.service.createTricycle({ ...dto, tenantId, depotId });
  }

  @Get('tricycles')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  @RequirePermission('tournees', 'read')
  findTricycles(@Req() req: any) {
    const { tenantId, depotId } = this.scope(req);
    return this.service.findTricycles(tenantId, depotId);
  }

  /**
   * Legacy workflow intentionally disabled.
   * The only writable source of truth is /depot-boissons/tournee-workflow.
   */
  @Post('ouvrir')
  ouvrirTournee() { throw new GoneException('Ancien workflow de tournée désactivé. Utilisez /depot-boissons/tournee-workflow.'); }

  @Post('charger')
  chargerTournee() { throw new GoneException('Ancien workflow de tournée désactivé. Utilisez /depot-boissons/tournee-workflow.'); }

  @Post('cloture-commerciale')
  clotureCommerciale() { throw new GoneException('Ancien workflow de tournée désactivé. Utilisez /depot-boissons/tournee-workflow.'); }

  @Post('valider-magasinier')
  validerMagasinier() { throw new GoneException('Ancien workflow de tournée désactivé. Utilisez /depot-boissons/tournee-workflow.'); }

  @Get('stats')
  @RequirePermission('tournees', 'read')
  stats(@Req() req: any) {
    const { tenantId, depotId } = this.scope(req);
    return this.service.statsTournees(tenantId, depotId);
  }

  @Get()
  @RequirePermission('tournees', 'read')
  findAll(@Req() req: any) {
    const { tenantId, depotId } = this.scope(req);
    return this.service.findAll(tenantId, depotId);
  }

  @Get(':id')
  @RequirePermission('tournees', 'read')
  findOne(@Req() req: any, @Param('id') id: string) {
    const { tenantId, depotId } = this.scope(req);
    return this.service.findOne(id, tenantId, depotId);
  }
}
