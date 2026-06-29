import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import {
  ParfumerieService,
  CreateProduitCosmetiqueDto,
  AjouterPointsDto,
  PaginationDto,
} from './parfumerie.service';

@Controller('parfumerie')
@Metier(MetierType.PARFUMERIE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class ParfumerieController {
  constructor(private readonly parfumerieService: ParfumerieService) {}

  @Get('produits')
  async findAllProduits(@Req() req: any, @Query() query: PaginationDto) {
    return this.parfumerieService.findAllProduits(req.user.tenantId, query);
  }

  @Post('produits')
  async createProduit(
    @Req() req: any,
    @Body() dto: CreateProduitCosmetiqueDto,
  ) {
    return this.parfumerieService.createProduit(req.user.tenantId, dto);
  }

  @Get('fidelite/client/:id')
  async getFideliteClient(@Req() req: any, @Param('id') id: string) {
    return this.parfumerieService.getFideliteClient(req.user.tenantId, id);
  }

  @Post('fidelite/points')
  async ajouterPoints(@Req() req: any, @Body() dto: AjouterPointsDto) {
    return this.parfumerieService.ajouterPoints(req.user.tenantId, dto);
  }

  @Get('fidelite/stats')
  async getFideliteStats(@Req() req: any) {
    return this.parfumerieService.getFideliteStats(req.user.tenantId);
  }

  @Get('fidelite/top-clients')
  async getTopClients(@Req() req: any, @Query('limit') limit?: string) {
    return this.parfumerieService.getTopClients(
      req.user.tenantId,
      limit ? parseInt(limit) : 10,
    );
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

  @Get('caisse')
  async getCaisse() {
    return { solde: 0, totalEntrees: 0, totalSorties: 0 };
  }
}
