import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { GlacierService, CreatePlatDto, CreateTableDto, CreateCommandeDto, CreateCompositionDto, PaginationDto } from './glacier.service';

@Controller('glacier')
@Metier(MetierType.GLACIER_SNACK)
@UseGuards(JwtAuthGuard, MetierGuard)
export class GlacierController {
  constructor(private readonly service: GlacierService) {}

  @Get('menu')
  async findAllPlats(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllPlats(req.user.tenantId, query);
  }

  @Post('menu')
  async createPlat(@Req() req: any, @Body() dto: CreatePlatDto) {
    return this.service.createPlat(req.user.tenantId, dto);
  }

  @Get('tables')
  async findAllTables(@Req() req: any) {
    return this.service.findAllTables(req.user.tenantId);
  }

  @Post('tables')
  async createTable(@Req() req: any, @Body() dto: CreateTableDto) {
    return this.service.createTable(req.user.tenantId, dto);
  }

  @Post('tables/:id/statut')
  async updateTableStatut(@Param('id') id: string, @Body('statut') statut: string) {
    return this.service.updateTableStatut(id, statut);
  }

  @Get('commandes')
  async findAllCommandes(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllCommandes(req.user.tenantId, query);
  }

  @Post('commandes')
  async createCommande(@Req() req: any, @Body() dto: CreateCommandeDto) {
    return this.service.createCommande(req.user.tenantId, dto);
  }

  @Get('compositions')
  async findAllCompositions(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllCompositions(req.user.tenantId, query);
  }

  @Post('compositions')
  async createComposition(@Req() req: any, @Body() dto: CreateCompositionDto) {
    return this.service.createComposition(req.user.tenantId, dto);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('caisse')
  async getCaisse() {
    return { data: [], total: 0 };
  }
}
