import {
  Controller,
  Get,
  Post,

  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
// DTOs Articles (dans module Boutique)
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import {
  PromotionsService,
  ArticlesService,
  StockService,
  ClientsService,
  FournisseursService,
  DepensesService,
  VentesService,
} from './boutique.service';
import { StockQueryDto } from './dto/stock-query.dto';

@Controller('boutique')
@Metier(MetierType.BOUTIQUE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class BoutiqueController {
  constructor(
    private promotionsService: PromotionsService,
    private articlesService: ArticlesService,
    private stockService: StockService,
    private clientsService: ClientsService,
    private fournisseursService: FournisseursService,
    private depensesService: DepensesService,
    private ventesService: VentesService,
  ) {}

  // ── Helper ────────────────────────────────────────────────────────────────

  private getTenantId(req: any): string {
    if (!req.user?.tenantId) {
      throw new BadRequestException('Accès refusé : tenantId manquant dans le token.');
    }
    return req.user.tenantId;
  }

  private getDepotId(req: any): string | undefined {
    const raw = req.headers['x-depot-id'];
    if (!raw || raw === 'undefined' || raw === 'null' || raw === 'all') return undefined;
    return raw;
  }

  // ── Promotions ────────────────────────────────────────────────────────────

  @Post('promotions')
  @RequirePermission('promotions', 'write')
  async createPromotion(@Body() data: any, @Req() req: any) {
    return this.promotionsService.create(data, this.getTenantId(req));
  }

  @Get('promotions')
  @RequirePermission('promotions', 'read')
  async findAllPromotions(@Req() req: any) {
    return this.promotionsService.findAll(this.getTenantId(req));
  }

  @Get('promotions/:id')
  @RequirePermission('promotions', 'read')
  async findOnePromotion(@Param('id') id: string, @Req() req: any) {
    return this.promotionsService.findOne(id, this.getTenantId(req));
  }

  @Patch('promotions/:id')
  @RequirePermission('promotions', 'write')
  async updatePromotion(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.promotionsService.update(id, data, this.getTenantId(req));
  }

  @Put('promotions/:id')
  @RequirePermission('promotions', 'write')
  async updatePromotionPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.promotionsService.update(id, data, this.getTenantId(req));
  }

  @Delete('promotions/:id')
  @RequirePermission('promotions', 'write')
  @HttpCode(HttpStatus.OK)
  async deletePromotion(@Param('id') id: string, @Req() req: any) {
    return this.promotionsService.delete(id, this.getTenantId(req));
  }

  // ── Articles ──────────────────────────────────────────────────────────────

 @Get('articles')
  @RequirePermission('stock', 'read')
  async findAllArticles(@Req() req: any, @Query() params: any) {
    return this.articlesService.findAll(this.getTenantId(req), params);
  }

  @Get('articles/:id')
  @RequirePermission('stock', 'read')
  async findOneArticle(@Param('id') id: string, @Req() req: any) {
    return this.articlesService.findOne(id, this.getTenantId(req));
  }

  @Post('articles')
  @RequirePermission('stock', 'write')
  async createArticle(@Body() data: CreateArticleDto, @Req() req: any) {
    // Le ValidationPipe va transformer et valider 'data' automatiquement ici
    return this.articlesService.create(data, this.getTenantId(req));
  }

  @Patch('articles/:id')
  @RequirePermission('stock', 'write')
  async updateArticle(
    @Param('id') id: string,
    @Body() data: UpdateArticleDto, // Utilise UpdateArticleDto ici
    @Req() req: any,
  ) {
    return this.articlesService.update(id, data, this.getTenantId(req));
  }

  @Put('articles/:id')
  @RequirePermission('stock', 'write')
  async updateArticlePut(
    @Param('id') id: string,
    @Body() data: UpdateArticleDto, // Et ici
    @Req() req: any,
  ) {
    return this.articlesService.update(id, data, this.getTenantId(req));
  }

  @Delete('articles/:id')
  @RequirePermission('stock', 'write')
  @HttpCode(HttpStatus.OK)
  async deleteArticle(@Param('id') id: string, @Req() req: any) {
    return this.articlesService.delete(id, this.getTenantId(req));
  }
  // ── Stock ─────────────────────────────────────────────────────────────────

  @Get('stock')
  @RequirePermission('stock', 'read')
  async findAllStock(@Req() req: any, @Query() query: StockQueryDto) {
    return this.stockService.findAll(
      this.getTenantId(req),
      this.getDepotId(req),
      query,
    );
  }

  // ── Clients ───────────────────────────────────────────────────────────────

  @Get('clients')
  @RequirePermission('clients', 'read')
  async findAllClients(@Req() req: any, @Query() params: any) {
    return this.clientsService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('clients/:id')
  @RequirePermission('clients', 'read')
  async findOneClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, this.getTenantId(req));
  }

  @Post('clients')
  @RequirePermission('clients', 'write')
  async createClient(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.clientsService.create({ ...data, depotId }, this.getTenantId(req));
  }

  @Patch('clients/:id')
  @RequirePermission('clients', 'write')
  async updateClient(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, data, this.getTenantId(req));
  }

  @Put('clients/:id')
  @RequirePermission('clients', 'write')
  async updateClientPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, data, this.getTenantId(req));
  }

  @Delete('clients/:id')
  @RequirePermission('clients', 'write')
  @HttpCode(HttpStatus.OK)
  async deleteClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.delete(id, this.getTenantId(req));
  }

  // ── Fournisseurs ──────────────────────────────────────────────────────────

  @Get('fournisseurs')
  @RequirePermission('fournisseurs', 'read')
  async findAllFournisseurs(@Req() req: any, @Query() params: any) {
    return this.fournisseursService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'read')
  async findOneFournisseur(@Param('id') id: string, @Req() req: any) {
    return this.fournisseursService.findOne(id, this.getTenantId(req));
  }

  @Post('fournisseurs')
  @RequirePermission('fournisseurs', 'write')
  async createFournisseur(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.fournisseursService.create({ ...data, depotId }, this.getTenantId(req));
  }

  @Patch('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'write')
  async updateFournisseur(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.fournisseursService.update(id, data, this.getTenantId(req));
  }

  @Put('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'write')
  async updateFournisseurPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.fournisseursService.update(id, data, this.getTenantId(req));
  }

  @Delete('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'write')
  @HttpCode(HttpStatus.OK)
  async deleteFournisseur(@Param('id') id: string, @Req() req: any) {
    return this.fournisseursService.delete(id, this.getTenantId(req));
  }

  // ── Dépenses ──────────────────────────────────────────────────────────────

  @Get('depenses')
  @RequirePermission('depenses', 'read')
  async findAllDepenses(@Req() req: any, @Query() params: any) {
    return this.depensesService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('depenses/:id')
  @RequirePermission('depenses', 'read')
  async findOneDepense(@Param('id') id: string, @Req() req: any) {
    return this.depensesService.findOne(id, this.getTenantId(req));
  }

  @Post('depenses')
  @RequirePermission('depenses', 'write')
  async createDepense(@Body() data: any, @Req() req: any) {
    // Injecter depotId depuis le header si non fourni dans le body
    const depotId = data.depotId || this.getDepotId(req);
    return this.depensesService.create(
      { ...data, depotId },
      this.getTenantId(req),
    );
  }

  @Patch('depenses/:id')
  @RequirePermission('depenses', 'write')
  async updateDepense(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.depensesService.update(id, data, this.getTenantId(req));
  }

  @Put('depenses/:id')
  @RequirePermission('depenses', 'write')
  async updateDepensePut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.depensesService.update(id, data, this.getTenantId(req));
  }

  @Delete('depenses/:id')
  @RequirePermission('depenses', 'write')
  @HttpCode(HttpStatus.OK)
  async deleteDepense(@Param('id') id: string, @Req() req: any) {
    return this.depensesService.delete(id, this.getTenantId(req));
  }

  // ── Ventes ────────────────────────────────────────────────────────────────

  @Post('ventes')
  @RequirePermission('ventes', 'write')
  async createVente(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.ventesService.createVente(
      this.getTenantId(req),
      { ...data, depotId },
      req.user.id,
    );
  }

  @Get('ventes')
  @RequirePermission('ventes', 'read')
  async findAllVentes(@Req() req: any, @Query() params: any) {
    return this.ventesService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('ventes/:id')
  @RequirePermission('ventes', 'read')
  async findOneVente(@Param('id') id: string, @Req() req: any) {
    return this.ventesService.findOne(id, this.getTenantId(req));
  }

  @Patch('ventes/:id/annuler')
  @RequirePermission('ventes', 'write')
  @HttpCode(HttpStatus.OK)
  async annulerVente(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.ventesService.annulerVente(id, this.getTenantId(req), body?.motif);
  }

  // ── Rapports ──────────────────────────────────────────────────────────────

  @Get('rapports')
  @RequirePermission('rapports', 'read')
  async getRapports(@Req() req: any, @Query() params: any) {
    return this.ventesService.getRapports(
      this.getTenantId(req),
      params.periode,
      params.dateDebut,
      params.dateFin,
    );
  }

  // ── Stats / Dashboard ─────────────────────────────────────────────────────

  @Get('stats')
  @RequirePermission('dashboard', 'read')
  async getStats(@Req() req: any) {
    return this.ventesService.getStats(this.getTenantId(req));
  }

  // ── Factures (alias Vente PAYE) ─────────────────────────────────────────

  @Get('factures')
  @RequirePermission('factures', 'read')
  async findAllFactures(
    @Req() req: any,
    @Query() params: any,
  ) {
    // Force statut PAYE côté backend
    return this.ventesService.findAll(this.getTenantId(req), {
      ...params,
      statut: 'PAYE',
      depotId: params?.depotId || this.getDepotId(req),
    });
  }

  @Get('factures/:id')
  @RequirePermission('factures', 'read')
  async findOneFacture(@Param('id') id: string, @Req() req: any) {
    const vente = await this.ventesService.findOne(id, this.getTenantId(req));
    if (vente.statut !== 'PAYE') {
      throw new BadRequestException('Facture introuvable : vente non payée');
    }
    return vente;
  }

  // ── Catégories ────────────────────────────────────────────────────────────

  @Get('categories')
  @RequirePermission('categories', 'read')
  getCategories(@Req() req: any, @Query() query: any) {
    return this.ventesService.findAllCategories(this.getTenantId(req), query);
  }


  @Get('categories/:id')
  @RequirePermission('categories', 'read')
  getCategorie(@Req() req: any, @Param('id') id: string) {
    return this.ventesService.findOneCategorie(this.getTenantId(req), id);
  }

  @Post('categories')
  @RequirePermission('categories', 'write')
  createCategorie(@Req() req: any, @Body() dto: any) {
    return this.ventesService.createCategorie(this.getTenantId(req), dto);
  }

  @Patch('categories/:id')
  @RequirePermission('categories', 'write')
  updateCategorie(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.ventesService.updateCategorie(this.getTenantId(req), id, dto);
  }

  @Put('categories/:id')
  @RequirePermission('categories', 'write')
  updateCategoriePut(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.ventesService.updateCategorie(this.getTenantId(req), id, dto);
  }

  @Delete('categories/:id')
  @RequirePermission('categories', 'write')
  @HttpCode(HttpStatus.OK)
  deleteCategorie(@Req() req: any, @Param('id') id: string) {
    return this.ventesService.deleteCategorie(this.getTenantId(req), id);
  }


  @Post('categories/seed/:typeBoutique')
  @RequirePermission('categories', 'write')
  seedCategories(@Req() req: any, @Param('typeBoutique') typeBoutique: string) {
    return this.ventesService.seedCategoriesByType(
      this.getTenantId(req),
      typeBoutique,
    );
  }

  @Put('parametres')
  @RequirePermission('parametres', 'write')
  async updateParametres(@Body() body: any) {
    return body;
  }

  @Patch('parametres')
  @RequirePermission('parametres', 'write')
  async patchParametres(@Body() body: any) {
    return body;
  }
}
