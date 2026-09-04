import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { buildAuditActor } from '../../audit/audit-actor.util';
import { PromotionsProductionService } from './promotions-production.service';

@Controller('boutique/promotions-production')
@Metier(MetierType.BOUTIQUE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class PromotionsProductionController {
  constructor(private readonly service: PromotionsProductionService) {}
  private tenant(req: any): string { return req.user?.tenantId; }
  private depot(req: any): string { return req.depotScope?.depotId || req.headers['x-depot-id']; }

  @Get()
  @RequirePermission('promotions', 'read')
  findAll(@Req() req: any) { return this.service.findAll(this.tenant(req), this.depot(req)); }

  @Get(':id')
  @RequirePermission('promotions', 'read')
  findOne(@Req() req: any, @Param('id') id: string) { return this.service.findOne(id, this.tenant(req), this.depot(req)); }

  @Post()
  @RequirePermission('promotions', 'write')
  create(@Req() req: any, @Body() body: any) { return this.service.create(body, this.tenant(req), this.depot(req), buildAuditActor(req)); }

  @Patch(':id')
  @RequirePermission('promotions', 'write')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, body, this.tenant(req), this.depot(req), buildAuditActor(req)); }

  @Put(':id')
  @RequirePermission('promotions', 'write')
  updatePut(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(id, body, this.tenant(req), this.depot(req), buildAuditActor(req)); }

  @Delete(':id')
  @RequirePermission('promotions', 'write')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: any, @Param('id') id: string) { return this.service.delete(id, this.tenant(req), this.depot(req), buildAuditActor(req)); }
}
