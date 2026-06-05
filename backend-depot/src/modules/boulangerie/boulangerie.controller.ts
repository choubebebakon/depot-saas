import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { BoulangerieService, CreateRecetteDto, AddIngredientDto, CreateProductionDto, PaginationDto } from './boulangerie.service';

@Controller('boulangerie')
@Metier(MetierType.BOULANGERIE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class BoulangerieController {
  constructor(private readonly service: BoulangerieService) {}

  @Get('recettes')
  async findAllRecettes(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllRecettes(req.user.tenantId, query);
  }

  @Post('recettes')
  async createRecette(@Req() req: any, @Body() dto: CreateRecetteDto) {
    return this.service.createRecette(req.user.tenantId, dto);
  }

  @Get('recettes/:id')
  async getRecette(@Param('id') id: string) {
    return this.service.getRecette(id);
  }

  @Post('recettes/:id/ingredients')
  async addIngredient(@Param('id') id: string, @Body() dto: AddIngredientDto) {
    return this.service.addIngredient(id, dto);
  }

  @Get('production')
  async findAllProduction(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllProduction(req.user.tenantId, query);
  }

  @Post('production')
  async createProduction(@Req() req: any, @Body() dto: CreateProductionDto) {
    return this.service.createProduction(req.user.tenantId, dto);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Post('parametres')
  async createParametres(@Body() body: any) {
    return body;
  }

  @Put('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }
}
