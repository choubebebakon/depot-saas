import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { TransportService, CreateVehiculeDto, CreateColisDto, CreateTrajetDto, PaginationDto } from './transport.service';

@Controller('transport')
@Metier(MetierType.TRANSPORT)
@UseGuards(JwtAuthGuard, MetierGuard)
export class TransportController {
  constructor(private readonly service: TransportService) {}

  @Get('vehicules')
  async findAllVehicules(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllVehicules(req.user.tenantId, query);
  }

  @Post('vehicules')
  async createVehicule(@Req() req: any, @Body() dto: CreateVehiculeDto) {
    return this.service.createVehicule(req.user.tenantId, dto);
  }

  @Get('colis')
  async findAllColis(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllColis(req.user.tenantId, query);
  }

  @Post('colis')
  async createColis(@Req() req: any, @Body() dto: CreateColisDto) {
    return this.service.createColis(req.user.tenantId, dto);
  }

  @Post('colis/:id/statut')
  async updateColisStatut(@Param('id') id: string, @Body('statut') statut: string) {
    return this.service.updateColisStatut(id, statut);
  }

  @Get('trajets')
  async findAllTrajets(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllTrajets(req.user.tenantId, query);
  }

  @Post('trajets')
  async createTrajet(@Req() req: any, @Body() dto: CreateTrajetDto) {
    return this.service.createTrajet(req.user.tenantId, dto);
  }

  @Post('trajets/:id/statut')
  async updateTrajetStatut(@Param('id') id: string, @Body('statut') statut: string) {
    return this.service.updateTrajetStatut(id, statut);
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
