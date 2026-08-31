import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { DepotBoissonsPromotionsService } from './promotions.service';

@Controller('depot-boissons/promotions')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
export class DepotBoissonsPromotionsController {
  constructor(private readonly service: DepotBoissonsPromotionsService) {}

  private tenantId(req: any): string {
    if (!req.user?.tenantId) {
      throw new BadRequestException('tenantId manquant dans le contexte authentifié.');
    }
    return req.user.tenantId;
  }

  private depotId(req: any): string {
    const raw = req.headers?.['x-depot-id'];
    const depotId = Array.isArray(raw) ? raw[0] : raw;
    if (!depotId || ['undefined', 'null', 'all'].includes(String(depotId))) {
      throw new BadRequestException('Dépôt actif requis.');
    }
    return String(depotId);
  }

  @Get()
  @RequirePermission('promotions', 'read')
  findAll(@Req() req: any) {
    return this.service.findAll(this.tenantId(req), this.depotId(req));
  }

  @Post()
  @RequirePermission('promotions', 'write')
  create(@Req() req: any, @Body() data: any) {
    return this.service.create(this.tenantId(req), this.depotId(req), data);
  }

  @Patch(':id')
  @RequirePermission('promotions', 'write')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.update(this.tenantId(req), this.depotId(req), id, data);
  }

  @Delete(':id')
  @RequirePermission('promotions', 'write')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(this.tenantId(req), this.depotId(req), id);
  }
}
