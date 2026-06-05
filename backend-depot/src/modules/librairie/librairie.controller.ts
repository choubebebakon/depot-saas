import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { LibrairieService, CreateLivreDto, CreateCommandeSpecialeDto, PaginationDto } from './librairie.service';

@Controller('librairie')
@Metier(MetierType.LIBRAIRIE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class LibrairieController {
  constructor(private readonly service: LibrairieService) {}

  @Get('catalogue')
  async findAllLivres(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllLivres(req.user.tenantId, query);
  }

  @Post('catalogue')
  async createLivre(@Req() req: any, @Body() dto: CreateLivreDto) {
    return this.service.createLivre(req.user.tenantId, dto);
  }

  @Get('commandes')
  async findAllCommandes(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllCommandes(req.user.tenantId, query);
  }

  @Post('commandes')
  async createCommande(@Req() req: any, @Body() dto: CreateCommandeSpecialeDto) {
    return this.service.createCommande(req.user.tenantId, dto);
  }

  @Post('commandes/:id/statut')
  async updateCommandeStatut(@Param('id') id: string, @Body('statut') statut: string) {
    return this.service.updateCommandeStatut(id, statut);
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

  @Post('caisse')
  async createCaisseEntry(@Body() body: any) {
    return body;
  }

  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }

  // --- Stubs Phase 4 ---

  @Get('config')
  async getConfig() {
    return {};
  }
}
