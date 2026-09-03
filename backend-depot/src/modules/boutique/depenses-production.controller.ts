import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { buildAuditActor } from '../../audit/audit-actor.util';
import { DepensesProductionService } from './depenses-production.service';
import { CreateDepenseDto, DepenseQueryDto, UpdateDepenseDto } from './dto/depense.dto';

@Controller('boutique/depenses-production')
@Metier(MetierType.BOUTIQUE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class DepensesProductionController {
  constructor(private readonly depensesService: DepensesProductionService) {}

  @Get()
  @RequirePermission('depenses', 'read')
  findAll(@Req() req: any, @Query() query: DepenseQueryDto) {
    return this.depensesService.findAll(req.user.tenantId, query, buildAuditActor(req));
  }

  @Get(':id')
  @RequirePermission('depenses', 'read')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.depensesService.findOne(id, req.user.tenantId, buildAuditActor(req));
  }

  @Post()
  @RequirePermission('depenses', 'write')
  create(@Req() req: any, @Body() body: CreateDepenseDto) {
    return this.depensesService.create(
      body,
      req.user.tenantId,
      buildAuditActor(req),
      req.headers['x-depot-id'],
    );
  }

  @Patch(':id')
  @RequirePermission('depenses', 'write')
  update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateDepenseDto) {
    return this.depensesService.update(id, body, req.user.tenantId, buildAuditActor(req));
  }

  @Put(':id')
  @RequirePermission('depenses', 'write')
  updatePut(@Req() req: any, @Param('id') id: string, @Body() body: UpdateDepenseDto) {
    return this.depensesService.update(id, body, req.user.tenantId, buildAuditActor(req));
  }

  @Delete(':id')
  @RequirePermission('depenses', 'write')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.depensesService.delete(id, req.user.tenantId, buildAuditActor(req));
  }
}
