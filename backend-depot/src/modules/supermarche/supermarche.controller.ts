import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Patch,
  Delete,
  Param,
  Put,
  BadRequestException,
} from '@nestjs/common';
import {
  SupermarcheService,
  PaginationDto,
  CreateRayonDto,
  UpdateRayonDto,
  AssignArticleDto,
  CreateCodeBarresDto,
  CreateArticleDto,
  UpdateArticleDto,
  UpdateStockDto,
  CreateClientDto,
  UpdateClientDto,
  CreateFournisseurDto,
  UpdateFournisseurDto,
  CreateDepenseDto,
  UpdateDepenseDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  CreateReceptionDto,
  UpdateReceptionDto,
  CreateVenteDto,
  InventaireDto,
} from './supermarche.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@Controller('supermarche')
@Metier(MetierType.SUPERMARCHE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class SupermarcheController {
  constructor(private service: SupermarcheService) {}

  // ── Rayons ────────────────────────────────────────────────────────────────

  @Get('rayons')
  @RequirePermission('rayons', 'read')
  async findAllRayons(@Req() req: any, @Query() query: PaginationDto) {
    this.checkTenantId(req);
    return this.service.findAllRayons(req.user.tenantId, query);
  }

  @Post('rayons')
  @RequirePermission('rayons', 'write')
  async createRayon(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createRayon(req.user.tenantId, data);
  }

  @Patch('rayons/:id')
  @RequirePermission('rayons', 'write')
  async updateRayon(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateRayonDto,
  ) {
    this.checkTenantId(req);
    return this.service.updateRayon(id, req.user.tenantId, data);
  }

  @Delete('rayons/:id')
  @RequirePermission('rayons', 'write')
  async deleteRayon(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deleteRayon(id, req.user.tenantId);
  }

  @Post('rayons/:id/articles')
  @RequirePermission('rayons', 'write')
  async assignArticle(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.assignArticleToRayon(
      id,
      data.articleId,
      req.user.tenantId,
    );
  }

  // ── Codes-Barres ──────────────────────────────────────────────────────────

  @Get('codes-barres/scan/:code')
  @RequirePermission('pos_caisse', 'read')
  async scanCode(@Req() req: any, @Param('code') code: string) {
    this.checkTenantId(req);
    return this.service.scanCodeBarres(code, req.user.tenantId);
  }

  @Post('codes-barres')
  @RequirePermission('stock', 'write')
  async createCodeBarres(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createCodeBarres(data, req.user.tenantId);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Get('stats')
  @RequirePermission('dashboard', 'read')
  async getStats(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.getStats(req.user.tenantId);
  }

  // ── Articles / Produits ───────────────────────────────────────────────────

  @Get('articles')
  @RequirePermission('stock', 'read')
  async findAllArticles(@Req() req: any, @Query() query: PaginationDto) {
    this.checkTenantId(req);
    return this.service.findAllArticles(
      req.user.tenantId,
      query.search,
      query.limit,
    );
  }

  @Get('produits') // Alias conservé pour rétrocompatibilité front-end
  @RequirePermission('stock', 'read')
  async findAllProduits(@Req() req: any, @Query() query: PaginationDto) {
    this.checkTenantId(req);
    return this.service.findAllArticles(
      req.user.tenantId,
      query.search,
      query.limit,
    );
  }

  @Get('articles/:id')
  @RequirePermission('stock', 'read')
  async findArticleById(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.findArticleById(id, req.user.tenantId);
  }

  @Post('articles')
  @RequirePermission('stock', 'write')
  async createArticle(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createArticle(req.user.tenantId, data);
  }

  @Patch('articles/:id')
  @RequirePermission('stock', 'write')
  async updateArticle(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.updateArticle(id, req.user.tenantId, data);
  }

  @Patch('produits/:id')
  @RequirePermission('stock', 'write')
  async partialUpdateProduit(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateStockDto,
  ) {
    this.checkTenantId(req);
    return this.service.partialUpdateArticleStock(id, req.user.tenantId, data);
  }

  @Delete('produits/:id')
  @RequirePermission('stock', 'write')
  async deleteProduit(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deleteArticle(id, req.user.tenantId);
  }

  // ── Clients ───────────────────────────────────────────────────────────────

  @Get('clients')
  @RequirePermission('clients', 'read')
  async findAllClients(@Req() req: any, @Query() query: PaginationDto) {
    this.checkTenantId(req);
    return this.service.findAllClients(
      req.user.tenantId,
      query.search,
      query.limit,
    );
  }

  @Post('clients')
  @RequirePermission('clients', 'write')
  async createClient(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createClient(req.user.tenantId, data);
  }

  @Patch('clients/:id')
  @RequirePermission('clients', 'write')
  async updateClient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.updateClient(id, req.user.tenantId, data);
  }

  @Delete('clients/:id')
  @RequirePermission('clients', 'write')
  async deleteClient(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deleteClient(id, req.user.tenantId);
  }

  // ── Fournisseurs ──────────────────────────────────────────────────────────

  @Get('fournisseurs')
  @RequirePermission('fournisseurs', 'read')
  async findAllFournisseurs(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.findAllFournisseurs(req.user.tenantId);
  }

  @Post('fournisseurs')
  @RequirePermission('fournisseurs', 'write')
  async createFournisseur(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createFournisseur(req.user.tenantId, data);
  }

  @Patch('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'write')
  async updateFournisseur(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.updateFournisseur(id, req.user.tenantId, data);
  }

  @Delete('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'write')
  async deleteFournisseur(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deleteFournisseur(id, req.user.tenantId);
  }

  // ── Dépenses ──────────────────────────────────────────────────────────────

  @Get('depenses')
  @RequirePermission('depenses', 'read')
  async findAllDepenses(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.findAllDepenses(req.user.tenantId);
  }

  @Post('depenses')
  @RequirePermission('depenses', 'write')
  async createDepense(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createDepense(req.user.tenantId, data);
  }

  @Patch('depenses/:id')
  @RequirePermission('depenses', 'write')
  async updateDepense(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.updateDepense(id, req.user.tenantId, data);
  }

  @Delete('depenses/:id')
  @RequirePermission('depenses', 'write')
  async deleteDepense(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deleteDepense(id, req.user.tenantId);
  }

  // ── Promotions ────────────────────────────────────────────────────────────

  @Get('promotions')
  @RequirePermission('promotions', 'read')
  async findAllPromotions(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.findAllPromotions(req.user.tenantId);
  }

  @Post('promotions')
  @RequirePermission('promotions', 'write')
  async createPromotion(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createPromotion(req.user.tenantId, data);
  }

  @Patch('promotions/:id')
  @RequirePermission('promotions', 'write')
  async updatePromotion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.updatePromotion(id, req.user.tenantId, data);
  }

  @Delete('promotions/:id')
  @RequirePermission('promotions', 'write')
  async deletePromotion(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deletePromotion(id, req.user.tenantId);
  }

  // ── Stock / Inventaire ────────────────────────────────────────────────────

  @Get('stock')
  @RequirePermission('stock', 'read')
  async findAllStock(
    @Req() req: any,
    @Query('depotId') depotId?: string,
    @Query('rayonId') rayonId?: string,
  ) {
    this.checkTenantId(req);
    return this.service.findAllStock(req.user.tenantId, depotId, rayonId);
  }

  @Post('stock/inventaire')
  @RequirePermission('inventaire', 'write')
  async createInventaire(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createInventaire(req.user.tenantId, data);
  }

  // ── Ventes ────────────────────────────────────────────────────────────────

  @Post('ventes')
  @RequirePermission('pos_caisse', 'write')
  async createVente(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createVente(req.user.tenantId, data, req.user.userId);
  }

  // ── Réceptions ────────────────────────────────────────────────────────────

  @Get('receptions')
  @RequirePermission('receptions', 'read')
  async findAllReceptions(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.findAllReceptions(req.user.tenantId);
  }

  @Post('receptions')
  @RequirePermission('receptions', 'write')
  async createReception(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.createReception(req.user.tenantId, data);
  }

  @Patch('receptions/:id')
  @RequirePermission('receptions', 'write')
  async updateReception(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkTenantId(req);
    return this.service.updateReception(req.user.tenantId, id, data);
  }

  @Delete('receptions/:id')
  @RequirePermission('receptions', 'write')
  async deleteReception(@Req() req: any, @Param('id') id: string) {
    this.checkTenantId(req);
    return this.service.deleteReception(req.user.tenantId, id);
  }

  // ── Paramètres ────────────────────────────────────────────────────────────

  @Get('parametres')
  @RequirePermission('parametres', 'read')
  async getParametres(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.getParametres(req.user.tenantId);
  }

  @Patch('parametres')
  @RequirePermission('parametres', 'write')
  async updateParametres(@Req() req: any, @Body() body: any) {
    this.checkTenantId(req);
    if (!body.section || !body.data) {
      throw new BadRequestException(
        "Les champs 'section' et 'data' sont requis.",
      );
    }
    return this.service.updateParametres(
      req.user.tenantId,
      body.section,
      body.data,
    );
  }

  // ── Rapports ──────────────────────────────────────────────────────────────

  @Get('rapports')
  @RequirePermission('rapports', 'read')
  async getRapports(
    @Req() req: any,
    @Query('periode') periode?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    this.checkTenantId(req);
    return this.service.getRapports(
      req.user.tenantId,
      periode,
      dateDebut,
      dateFin,
    );
  }

  // ── Dépôts ────────────────────────────────────────────────────────────────

  @Get('depots')
  @RequirePermission('depots', 'read')
  async findAllDepots(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.findAllDepots(req.user.tenantId);
  }

  // ── Reset Data ────────────────────────────────────────────────────────────

  @Post('reset-data')
  @RequirePermission('parametres', 'write')
  async resetData(@Req() req: any) {
    this.checkTenantId(req);
    return this.service.resetData(req.user.tenantId);
  }

  // --- Stubs Phase 4 ---

  @Put('parametres')
  @RequirePermission('parametres', 'write')
  async putParametres(@Body() body: Record<string, unknown>) {
    return body;
  }

  @Get('config')
  @RequirePermission('parametres', 'read')
  async getConfig() {
    return {};
  }

  @Get('caisse/statut')
  @RequirePermission('pos_caisse', 'read')
  async getCaisseStatut(@Req() req: any, @Query('depotId') depotId?: string) {
    this.checkTenantId(req);
    return this.service.getCaisseStatut(
      req.user.tenantId,
      depotId,
    );
  }

  @Post('caisse/ouvrir')
  @RequirePermission('pos_caisse', 'write')
  async ouvrirCaisse(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.ouvrirCaisse(req.user.tenantId, {
      ...data,
      userId: req.user.userId,
    });
  }

  @Post('caisse/fermer')
  @RequirePermission('pos_caisse', 'write')
  async fermerCaisse(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.fermerCaisse(req.user.tenantId, data);
  }

  @Post('caisse/mouvement')
  @RequirePermission('pos_caisse', 'write')
  async mouvementCaisse(@Req() req: any, @Body() data: any) {
    this.checkTenantId(req);
    return this.service.mouvementCaisse(req.user.tenantId, data);
  }

  @Get('caisse/rapport-journalier')
  @RequirePermission('pos_caisse', 'read')
  async rapportJournalier(@Req() req: any, @Query('depotId') depotId?: string) {
    this.checkTenantId(req);
    return this.service.rapportJournalier(
      req.user.tenantId,
      depotId,
    );
  }

  // ── Helper Sécurité Multi-Tenant ──────────────────────────────────────────

  private checkTenantId(req: any) {
    if (!req.user?.tenantId) {
      throw new BadRequestException(
        "Accès refusé : Identifiant d'organisation (tenantId) manquant dans le token.",
      );
    }
  }
}
