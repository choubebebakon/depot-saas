import { Controller, Post, Get, Put, Body, Query, UseGuards, Req, Patch, Param, Delete } from '@nestjs/common';
import { GarageService } from './garage.service';
import { PaginationDto } from '../supermarche/supermarche.service';
import { CreateVehiculeClientDto, CreateFicheTravailDto, UpdateFicheStatutDto } from './dto/garage.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('garage')
@Metier(MetierType.GARAGE_AUTOMOBILE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class GarageController {
  constructor(private service: GarageService) {}

  @Get('vehicules')
  async findAllVehicules(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllVehicules(req.user.tenantId, query);
  }

  @Post('vehicules')
  async createVehicule(@Req() req: any, @Body() data: CreateVehiculeClientDto) {
    return this.service.createVehicule(req.user.tenantId, data);
  }

  @Get('fiches-travaux')
  async findAllFiches(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllFiches(req.user.tenantId, query);
  }

  @Post('fiches-travaux')
  async createFiche(@Req() req: any, @Body() data: CreateFicheTravailDto) {
    return this.service.createFiche(req.user.tenantId, data);
  }

  @Patch('fiches-travaux/:id/statut')
  async updateStatut(@Req() req: any, @Param('id') id: string, @Body() data: UpdateFicheStatutDto) {
    return this.service.updateFicheStatut(id, req.user.tenantId, data);
  }

  @Delete('vehicules/:id')
  async deleteVehicule(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteVehicule(id, req.user.tenantId);
  }

  @Delete('fiches-travaux/:id')
  async deleteFiche(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteFiche(id, req.user.tenantId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('config')
  async getConfig() {
    return {};
  }

  @Put('config')
  async updateConfig(@Body() body: any) {
    return body;
  }

  @Get('caisse')
  async getCaisse() {
    return { data: [], total: 0 };
  }

  @Post('caisse')
  async createCaisseEntry(@Body() body: any) {
    return body;
  }

  // --- Stubs Phase 4 ---

  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: Record<string, unknown>) {
    return body;
  }
}
