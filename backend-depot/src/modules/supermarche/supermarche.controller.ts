import { Controller, Post, Get, Body, Query, UseGuards, Req, Patch, Delete, Param } from '@nestjs/common';
import { SupermarcheService, PaginationDto, CreateRayonDto, UpdateRayonDto, AssignArticleDto, CreateCodeBarresDto, CreateArticleDto, UpdateArticleDto, UpdateStockDto, CreateClientDto, UpdateClientDto, CreateFournisseurDto, UpdateFournisseurDto, CreateDepenseDto, UpdateDepenseDto, CreatePromotionDto, UpdatePromotionDto, CreateReceptionDto, CreateVenteDto, InventaireDto } from './supermarche.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('supermarche')
@Metier(MetierType.SUPERMARCHE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class SupermarcheController {
  constructor(private service: SupermarcheService) {}

  // ── Rayons ────────────────────────────────────────────────────────────────

  @Get('rayons')
  async findAllRayons(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllRayons(req.user.tenantId, query);
  }

  @Post('rayons')
  async createRayon(@Req() req: any, @Body() data: CreateRayonDto) {
    return this.service.createRayon(req.user.tenantId, data);
  }

  @Patch('rayons/:id')
  async updateRayon(@Req() req: any, @Param('id') id: string, @Body() data: UpdateRayonDto) {
    return this.service.updateRayon(id, req.user.tenantId, data);
  }

  @Delete('rayons/:id')
  async deleteRayon(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteRayon(id, req.user.tenantId);
  }

  @Post('rayons/:id/articles')
  async assignArticle(@Req() req: any, @Param('id') id: string, @Body() data: AssignArticleDto) {
    return this.service.assignArticleToRayon(id, data.articleId, req.user.tenantId);
  }

  // ── Codes-Barres ──────────────────────────────────────────────────────────

  @Get('codes-barres/scan/:code')
  async scanCode(@Req() req: any, @Param('code') code: string) {
    return this.service.scanCodeBarres(code, req.user.tenantId);
  }

  @Post('codes-barres')
  async createCodeBarres(@Req() req: any, @Body() data: CreateCodeBarresDto) {
    return this.service.createCodeBarres(data, req.user.tenantId);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // ── Articles / Produits ───────────────────────────────────────────────────

  @Get('articles')
  async findAllArticles(@Req() req: any, @Query('search') search?: string, @Query('limit') limit?: string) {
    return this.service.findAllArticles(req.user.tenantId, search, limit ? Number(limit) : undefined);
  }

  @Get('produits')
  async findAllProduits(@Req() req: any, @Query('search') search?: string, @Query('limit') limit?: string) {
    return this.service.findAllArticles(req.user.tenantId, search, limit ? Number(limit) : undefined);
  }

  @Get('articles/:id')
  async findArticleById(@Req() req: any, @Param('id') id: string) {
    return this.service.findArticleById(id, req.user.tenantId);
  }

  @Post('articles')
  async createArticle(@Req() req: any, @Body() data: CreateArticleDto) {
    return this.service.createArticle(req.user.tenantId, data);
  }

  @Patch('articles/:id')
  async updateArticle(@Req() req: any, @Param('id') id: string, @Body() data: UpdateArticleDto) {
    return this.service.updateArticle(id, req.user.tenantId, data);
  }

  @Patch('produits/:id')
  async partialUpdateProduit(@Req() req: any, @Param('id') id: string, @Body() data: UpdateStockDto) {
    return this.service.partialUpdateArticleStock(id, req.user.tenantId, data);
  }

  @Delete('produits/:id')
  async deleteProduit(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteArticle(id, req.user.tenantId);
  }

  // ── Clients ───────────────────────────────────────────────────────────────

  @Get('clients')
  async findAllClients(@Req() req: any, @Query('search') search?: string, @Query('limit') limit?: string) {
    return this.service.findAllClients(req.user.tenantId, search, limit ? Number(limit) : undefined);
  }

  @Post('clients')
  async createClient(@Req() req: any, @Body() data: CreateClientDto) {
    return this.service.createClient(req.user.tenantId, data);
  }

  @Patch('clients/:id')
  async updateClient(@Req() req: any, @Param('id') id: string, @Body() data: UpdateClientDto) {
    return this.service.updateClient(id, req.user.tenantId, data);
  }

  @Delete('clients/:id')
  async deleteClient(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteClient(id, req.user.tenantId);
  }

  // ── Fournisseurs ──────────────────────────────────────────────────────────

  @Get('fournisseurs')
  async findAllFournisseurs(@Req() req: any) {
    return this.service.findAllFournisseurs(req.user.tenantId);
  }

  @Post('fournisseurs')
  async createFournisseur(@Req() req: any, @Body() data: CreateFournisseurDto) {
    return this.service.createFournisseur(req.user.tenantId, data);
  }

  @Patch('fournisseurs/:id')
  async updateFournisseur(@Req() req: any, @Param('id') id: string, @Body() data: UpdateFournisseurDto) {
    return this.service.updateFournisseur(id, req.user.tenantId, data);
  }

  @Delete('fournisseurs/:id')
  async deleteFournisseur(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteFournisseur(id, req.user.tenantId);
  }

  // ── Dépenses ──────────────────────────────────────────────────────────────

  @Get('depenses')
  async findAllDepenses(@Req() req: any) {
    return this.service.findAllDepenses(req.user.tenantId);
  }

  @Post('depenses')
  async createDepense(@Req() req: any, @Body() data: CreateDepenseDto) {
    return this.service.createDepense(req.user.tenantId, data);
  }

  @Patch('depenses/:id')
  async updateDepense(@Req() req: any, @Param('id') id: string, @Body() data: UpdateDepenseDto) {
    return this.service.updateDepense(id, req.user.tenantId, data);
  }

  @Delete('depenses/:id')
  async deleteDepense(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteDepense(id, req.user.tenantId);
  }

  // ── Promotions ────────────────────────────────────────────────────────────

  @Get('promotions')
  async findAllPromotions(@Req() req: any) {
    return this.service.findAllPromotions(req.user.tenantId);
  }

  @Post('promotions')
  async createPromotion(@Req() req: any, @Body() data: CreatePromotionDto) {
    return this.service.createPromotion(req.user.tenantId, data);
  }

  @Patch('promotions/:id')
  async updatePromotion(@Req() req: any, @Param('id') id: string, @Body() data: UpdatePromotionDto) {
    return this.service.updatePromotion(id, req.user.tenantId, data);
  }

  @Delete('promotions/:id')
  async deletePromotion(@Req() req: any, @Param('id') id: string) {
    return this.service.deletePromotion(id, req.user.tenantId);
  }

  // ── Stock / Inventaire ────────────────────────────────────────────────────

  @Get('stock')
  async findAllStock(@Req() req: any, @Query('depotId') depotId?: string, @Query('rayonId') rayonId?: string) {
    return this.service.findAllStock(req.user.tenantId, depotId, rayonId);
  }

  @Post('stock/inventaire')
  async createInventaire(@Req() req: any, @Body() data: InventaireDto) {
    return this.service.createInventaire(req.user.tenantId, data);
  }

  // ── Ventes ────────────────────────────────────────────────────────────────

  @Post('ventes')
  async createVente(@Req() req: any, @Body() data: CreateVenteDto) {
    return this.service.createVente(req.user.tenantId, data, req.user.userId);
  }

  // ── Réceptions ────────────────────────────────────────────────────────────

  @Get('receptions')
  async findAllReceptions(@Req() req: any) {
    return this.service.findAllReceptions(req.user.tenantId);
  }

  @Post('receptions')
  async createReception(@Req() req: any, @Body() data: CreateReceptionDto) {
    return this.service.createReception(req.user.tenantId, data);
  }

  // ── Paramètres ────────────────────────────────────────────────────────────

  @Get('parametres')
  async getParametres(@Req() req: any) {
    return this.service.getParametres(req.user.tenantId);
  }

  @Patch('parametres')
  async updateParametres(@Req() req: any, @Body() body: { section: string; data: any }) {
    return this.service.updateParametres(req.user.tenantId, body.section, body.data);
  }

  // ── Rapports ──────────────────────────────────────────────────────────────

  @Get('rapports')
  async getRapports(
    @Req() req: any,
    @Query('periode') periode?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.service.getRapports(req.user.tenantId, periode, dateDebut, dateFin);
  }

  // ── Dépôts ────────────────────────────────────────────────────────────────

  @Get('depots')
  async findAllDepots(@Req() req: any) {
    return this.service.findAllDepots(req.user.tenantId);
  }

  // ── Reset Data ────────────────────────────────────────────────────────────

  @Post('reset-data')
  async resetData(@Req() req: any) {
    return this.service.resetData(req.user.tenantId);
  }
}
