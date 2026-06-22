import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PromotionsService, ArticlesService, StockService, ClientsService, FournisseursService, DepensesService, PersonnelService, VentesService } from './boutique.service';
import { StockQueryDto } from './dto/stock-query.dto';

@Controller('boutique')
export class BoutiqueController {
  constructor(
    private promotionsService: PromotionsService,
    private articlesService: ArticlesService,
    private stockService: StockService,
    private clientsService: ClientsService,
    private fournisseursService: FournisseursService,
    private depensesService: DepensesService,
    private personnelService: PersonnelService,
    private ventesService: VentesService,
  ) {}

  // --- Promotions (existants) ---
  @Post('promotions')
  async createPromotion(@Body() data: any) {
    return this.promotionsService.create(data);
  }

  @Get('promotions')
  async findAllPromotions(@Req() req: any) {
    return this.promotionsService.findAll(req.user.tenantId);
  }

  @Get('promotions/:id')
  async findOnePromotion(@Param('id') id: string, @Req() req: any) {
    return this.promotionsService.findOne(id, req.user.tenantId);
  }

  @Put('promotions/:id')
  async updatePromotion(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.promotionsService.update(id, data, req.user.tenantId);
  }

  @Delete('promotions/:id')
  async deletePromotion(@Param('id') id: string, @Req() req: any) {
    return this.promotionsService.delete(id, req.user.tenantId);
  }

  // --- Articles ---
  @Get('articles')
  async findAllArticles(@Req() req: any, @Query() params: any) {
    return this.articlesService.findAll(req.user.tenantId, params);
  }

  @Get('articles/:id')
  async findOneArticle(@Param('id') id: string, @Req() req: any) {
    return this.articlesService.findOne(id, req.user.tenantId);
  }

  @Post('articles')
  async createArticle(@Body() data: any, @Req() req: any) {
    return this.articlesService.create(data, req.user.tenantId);
  }

  @Put('articles/:id')
  async updateArticle(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.articlesService.update(id, data, req.user.tenantId);
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string, @Req() req: any) {
    return this.articlesService.delete(id, req.user.tenantId);
  }

  // --- Stock ---
  @Get('stock')
  async findAllStock(@Req() req: any, @Query() query: StockQueryDto) {
    const depotId = req.headers['x-depot-id'];
    return this.stockService.findAll(req.user.tenantId, depotId, query);
  }

  // --- Clients ---
  @Get('clients')
  async findAllClients(@Req() req: any, @Query() params: any) {
    return this.clientsService.findAll(req.user.tenantId, params);
  }

  @Get('clients/:id')
  async findOneClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user.tenantId);
  }

  @Post('clients')
  async createClient(@Body() data: any, @Req() req: any) {
    return this.clientsService.create(data, req.user.tenantId);
  }

  @Put('clients/:id')
  async updateClient(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.clientsService.update(id, data, req.user.tenantId);
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.delete(id, req.user.tenantId);
  }

  // --- Fournisseurs ---
  @Get('fournisseurs')
  async findAllFournisseurs(@Req() req: any, @Query() params: any) {
    return this.fournisseursService.findAll(req.user.tenantId, params);
  }

  @Get('fournisseurs/:id')
  async findOneFournisseur(@Param('id') id: string, @Req() req: any) {
    return this.fournisseursService.findOne(id, req.user.tenantId);
  }

  @Post('fournisseurs')
  async createFournisseur(@Body() data: any, @Req() req: any) {
    return this.fournisseursService.create(data, req.user.tenantId);
  }

  @Put('fournisseurs/:id')
  async updateFournisseur(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.fournisseursService.update(id, data, req.user.tenantId);
  }

  @Delete('fournisseurs/:id')
  async deleteFournisseur(@Param('id') id: string, @Req() req: any) {
    return this.fournisseursService.delete(id, req.user.tenantId);
  }

  // --- Dépenses ---
  @Get('depenses')
  async findAllDepenses(@Req() req: any, @Query() params: any) {
    return this.depensesService.findAll(req.user.tenantId, params);
  }

  @Get('depenses/:id')
  async findOneDepense(@Param('id') id: string, @Req() req: any) {
    return this.depensesService.findOne(id, req.user.tenantId);
  }

  @Post('depenses')
  async createDepense(@Body() data: any, @Req() req: any) {
    return this.depensesService.create(data, req.user.tenantId);
  }

  @Put('depenses/:id')
  async updateDepense(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.depensesService.update(id, data, req.user.tenantId);
  }

  @Delete('depenses/:id')
  async deleteDepense(@Param('id') id: string, @Req() req: any) {
    return this.depensesService.delete(id, req.user.tenantId);
  }

  // --- Personnel ---
  @Get('personnel')
  async findAllPersonnel(@Req() req: any, @Query() params: any) {
    return this.personnelService.findAll(req.user.tenantId, params);
  }

  @Get('personnel/:id')
  async findOnePersonnel(@Param('id') id: string, @Req() req: any) {
    return this.personnelService.findOne(id, req.user.tenantId);
  }

  @Post('personnel')
  async createPersonnel(@Body() data: any, @Req() req: any) {
    return this.personnelService.create(data, req.user.tenantId);
  }

  @Put('personnel/:id')
  async updatePersonnel(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.personnelService.update(id, data, req.user.tenantId);
  }

  @Delete('personnel/:id')
  async deletePersonnel(@Param('id') id: string, @Req() req: any) {
    return this.personnelService.delete(id, req.user.tenantId);
  }

  // --- Ventes ---
  @Post('ventes')
  async createVente(@Body() data: any, @Req() req: any) {
    return this.ventesService.createVente(req.user.tenantId, data, req.user.id);
  }

  @Get('ventes')
  async findAllVentes(@Req() req: any, @Query() params: any) {
    return this.ventesService.findAll(req.user.tenantId, params);
  }

  @Get('ventes/:id')
  async findOneVente(@Param('id') id: string, @Req() req: any) {
    return this.ventesService.findOne(id, req.user.tenantId);
  }

  // --- Rapports ---
  @Get('rapports')
  async getRapports(@Req() req: any, @Query() params: any) {
    return this.ventesService.getRapports(req.user.tenantId, params.periode, params.dateDebut, params.dateFin);
  }

  // --- Stats / Dashboard ---
  @Get('stats')
  async getStats(@Req() req: any) {
    return this.ventesService.getStats(req.user.tenantId);
  }

  // --- Catégories ---
  @Get('categories')
  getCategories(@Req() req: any, @Query() query: any) {
    return this.ventesService.findAllCategories(req.user.tenantId, query);
  }

  @Get('categories/:id')
  getCategorie(@Req() req: any, @Param('id') id: string) {
    return this.ventesService.findOneCategorie(req.user.tenantId, id);
  }

  @Post('categories')
  createCategorie(@Req() req: any, @Body() dto: any) {
    return this.ventesService.createCategorie(req.user.tenantId, dto);
  }

  @Put('categories/:id')
  updateCategorie(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.ventesService.updateCategorie(req.user.tenantId, id, dto);
  }

  @Delete('categories/:id')
  deleteCategorie(@Req() req: any, @Param('id') id: string) {
    return this.ventesService.deleteCategorie(req.user.tenantId, id);
  }

  @Post('categories/seed/:typeBoutique')
  seedCategories(@Req() req: any, @Param('typeBoutique') typeBoutique: string) {
    return this.ventesService.seedCategoriesByType(req.user.tenantId, typeBoutique);
  }

  // --- Stubs Phase 2 (existants) ---
  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }

  @Get('caisse')
  async getCaisse() {
    return { data: [], total: 0 };
  }
}
