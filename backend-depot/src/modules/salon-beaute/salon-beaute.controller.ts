import { Controller, Post, Get, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { SalonBeauteService, CreatePrestationDto, CreateRendezVousSalonDto, UpdateRdvStatutDto, PaginationDto } from './salon-beaute.service';

@Controller('salon')
@Metier(MetierType.SALON_BEAUTE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class SalonBeauteController {
  constructor(private readonly salonService: SalonBeauteService) {}

  // ── Prestations ──────────────────────────────────────────────

  @Get('prestations')
  async findAllPrestations(@Req() req: any, @Query() query: PaginationDto) {
    return this.salonService.findAllPrestations(req.user.tenantId, query);
  }

  @Post('prestations')
  async createPrestation(@Req() req: any, @Body() dto: CreatePrestationDto) {
    return this.salonService.createPrestation(req.user.tenantId, dto);
  }

  @Patch('prestations/:id/disponibilite')
  async toggleDisponibilite(@Req() req: any, @Param('id') id: string) {
    return this.salonService.toggleDisponibilite(id, req.user.tenantId);
  }

  // ── Rendez-vous ──────────────────────────────────────────────

  @Get('rdv')
  async findAllRdv(@Req() req: any, @Query() query: PaginationDto) {
    return this.salonService.findAllRdv(req.user.tenantId, query);
  }

  @Post('rdv')
  async createRdv(@Req() req: any, @Body() dto: CreateRendezVousSalonDto) {
    return this.salonService.createRdv(req.user.tenantId, dto);
  }

  @Get('rdv/today')
  async getRdvToday(@Req() req: any) {
    return this.salonService.getRdvToday(req.user.tenantId);
  }

  @Patch('rdv/:id/statut')
  async updateRdvStatut(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRdvStatutDto) {
    return this.salonService.updateRdvStatut(id, req.user.tenantId, dto);
  }

  // ── Statistiques ─────────────────────────────────────────────

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.salonService.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }

  @Delete('rdv/:id')
  async deleteRdv(@Param('id') id: string) {
    return { success: true };
  }
}
