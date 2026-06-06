import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, Put } from '@nestjs/common';
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

  // --- Transport : ressources complémentaires (stubs tenant-aware) ---

  @Get('chauffeurs')
  async findAllChauffeurs(@Req() req: any, @Query() query: PaginationDto) {
    return { data: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  @Post('chauffeurs')
  async createChauffeur(@Req() req: any, @Body() dto: Record<string, unknown>) {
    return { id: `stub-${Date.now()}`, ...dto, tenantId: req.user.tenantId };
  }

  @Get('personnel')
  async findAllPersonnel(@Req() req: any, @Query() query: PaginationDto) {
    return { data: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  @Post('personnel')
  async createPersonnel(@Req() req: any, @Body() dto: Record<string, unknown>) {
    return { id: `stub-${Date.now()}`, ...dto, tenantId: req.user.tenantId };
  }

  @Get('livraisons')
  async findAllLivraisons(@Req() req: any, @Query() query: PaginationDto) {
    return { data: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  @Post('livraisons')
  async createLivraison(@Req() req: any, @Body() dto: Record<string, unknown>) {
    return { id: `stub-${Date.now()}`, ...dto, tenantId: req.user.tenantId };
  }

  @Get('depenses')
  async findAllDepenses(@Req() req: any) {
    return { data: [], total: 0 };
  }

  @Post('depenses')
  async createDepense(@Req() req: any, @Body() dto: Record<string, unknown>) {
    return { id: `stub-${Date.now()}`, ...dto, tenantId: req.user.tenantId };
  }

  @Get('clients')
  async findAllClients(@Req() req: any, @Query() query: PaginationDto) {
    return { data: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  @Post('clients')
  async createClient(@Req() req: any, @Body() dto: Record<string, unknown>) {
    return { id: `stub-${Date.now()}`, ...dto, tenantId: req.user.tenantId };
  }

  // --- Stubs Phase 2 ---
  @Get('caisse')
  async getCaisse() {
    return { data: [], total: 0 };
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

  @Get('config')
  async getConfig() {
    return {};
  }
}
