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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import {
  PromotionsService,
  ArticlesService,
  StockService,
  ClientsService,
  FournisseursService,
  DepensesService,
  PersonnelService,
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
    private personnelService: PersonnelService,
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
  async createPromotion(@Body() data: any, @Req() req: any) {
    return this.promotionsService.create(data, this.getTenantId(req));
  }

  @Get('promotions')
  async findAllPromotions(@Req() req: any) {
    return this.promotionsService.findAll(this.getTenantId(req));
  }

  @Get('promotions/:id')
  async findOnePromotion(@Param('id') id: string, @Req() req: any) {
    return this.promotionsService.findOne(id, this.getTenantId(req));
  }

  @Patch('promotions/:id')
  async updatePromotion(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.promotionsService.update(id, data, this.getTenantId(req));
  }

  @Put('promotions/:id')
  async updatePromotionPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.promotionsService.update(id, data, this.getTenantId(req));
  }

  @Delete('promotions/:id')
  @HttpCode(HttpStatus.OK)
  async deletePromotion(@Param('id') id: string, @Req() req: any) {
    return this.promotionsService.delete(id, this.getTenantId(req));
  }

  // ── Articles ──────────────────────────────────────────────────────────────

  @Get('articles')
  async findAllArticles(@Req() req: any, @Query() params: any) {
    return this.articlesService.findAll(this.getTenantId(req), params);
  }

  @Get('articles/:id')
  async findOneArticle(@Param('id') id: string, @Req() req: any) {
    return this.articlesService.findOne(id, this.getTenantId(req));
  }

  @Post('articles')
  async createArticle(@Body() data: any, @Req() req: any) {
    return this.articlesService.create(data, this.getTenantId(req));
  }

  @Patch('articles/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.articlesService.update(id, data, this.getTenantId(req));
  }

  @Put('articles/:id')
  async updateArticlePut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.articlesService.update(id, data, this.getTenantId(req));
  }

  @Delete('articles/:id')
  @HttpCode(HttpStatus.OK)
  async deleteArticle(@Param('id') id: string, @Req() req: any) {
    return this.articlesService.delete(id, this.getTenantId(req));
  }

  // ── Stock ─────────────────────────────────────────────────────────────────

  @Get('stock')
  async findAllStock(@Req() req: any, @Query() query: StockQueryDto) {
    return this.stockService.findAll(
      this.getTenantId(req),
      this.getDepotId(req),
      query,
    );
  }

  // ── Clients ───────────────────────────────────────────────────────────────

  @Get('clients')
  async findAllClients(@Req() req: any, @Query() params: any) {
    return this.clientsService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('clients/:id')
  async findOneClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, this.getTenantId(req));
  }

  @Post('clients')
  async createClient(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.clientsService.create({ ...data, depotId }, this.getTenantId(req));
  }

  @Patch('clients/:id')
  async updateClient(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, data, this.getTenantId(req));
  }

  @Put('clients/:id')
  async updateClientPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, data, this.getTenantId(req));
  }

  @Delete('clients/:id')
  @HttpCode(HttpStatus.OK)
  async deleteClient(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.delete(id, this.getTenantId(req));
  }

  // ── Fournisseurs ──────────────────────────────────────────────────────────

  @Get('fournisseurs')
  async findAllFournisseurs(@Req() req: any, @Query() params: any) {
    return this.fournisseursService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('fournisseurs/:id')
  async findOneFournisseur(@Param('id') id: string, @Req() req: any) {
    return this.fournisseursService.findOne(id, this.getTenantId(req));
  }

  @Post('fournisseurs')
  async createFournisseur(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.fournisseursService.create({ ...data, depotId }, this.getTenantId(req));
  }

  @Patch('fournisseurs/:id')
  async updateFournisseur(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.fournisseursService.update(id, data, this.getTenantId(req));
  }

  @Put('fournisseurs/:id')
  async updateFournisseurPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.fournisseursService.update(id, data, this.getTenantId(req));
  }

  @Delete('fournisseurs/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFournisseur(@Param('id') id: string, @Req() req: any) {
    return this.fournisseursService.delete(id, this.getTenantId(req));
  }

  // ── Dépenses ──────────────────────────────────────────────────────────────

  @Get('depenses')
  async findAllDepenses(@Req() req: any, @Query() params: any) {
    return this.depensesService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('depenses/:id')
  async findOneDepense(@Param('id') id: string, @Req() req: any) {
    return this.depensesService.findOne(id, this.getTenantId(req));
  }

  @Post('depenses')
  async createDepense(@Body() data: any, @Req() req: any) {
    // Injecter depotId depuis le header si non fourni dans le body
    const depotId = data.depotId || this.getDepotId(req);
    return this.depensesService.create(
      { ...data, depotId },
      this.getTenantId(req),
    );
  }

  @Patch('depenses/:id')
  async updateDepense(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.depensesService.update(id, data, this.getTenantId(req));
  }

  @Put('depenses/:id')
  async updateDepensePut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.depensesService.update(id, data, this.getTenantId(req));
  }

  @Delete('depenses/:id')
  @HttpCode(HttpStatus.OK)
  async deleteDepense(@Param('id') id: string, @Req() req: any) {
    return this.depensesService.delete(id, this.getTenantId(req));
  }

  // ── Personnel ─────────────────────────────────────────────────────────────

  @Get('personnel')
  async findAllPersonnel(@Req() req: any, @Query() params: any) {
    return this.personnelService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('personnel/:id')
  async findOnePersonnel(@Param('id') id: string, @Req() req: any) {
    return this.personnelService.findOne(id, this.getTenantId(req));
  }

  @Post('personnel')
  async createPersonnel(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.personnelService.create(
      { ...data, depotId },
      this.getTenantId(req),
    );
  }

  @Patch('personnel/:id')
  async updatePersonnel(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.personnelService.update(id, data, this.getTenantId(req));
  }

  @Put('personnel/:id')
  async updatePersonnelPut(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.personnelService.update(id, data, this.getTenantId(req));
  }

  @Delete('personnel/:id')
  @HttpCode(HttpStatus.OK)
  async deletePersonnel(@Param('id') id: string, @Req() req: any) {
    return this.personnelService.delete(id, this.getTenantId(req));
  }

  // ── Ventes ────────────────────────────────────────────────────────────────

  @Post('ventes')
  async createVente(@Body() data: any, @Req() req: any) {
    const depotId = data.depotId || this.getDepotId(req);
    return this.ventesService.createVente(
      this.getTenantId(req),
      { ...data, depotId },
      req.user.id,
    );
  }

  @Get('ventes')
  async findAllVentes(@Req() req: any, @Query() params: any) {
    return this.ventesService.findAll(this.getTenantId(req), {
      ...params,
      depotId: params.depotId || this.getDepotId(req),
    });
  }

  @Get('ventes/:id')
  async findOneVente(@Param('id') id: string, @Req() req: any) {
    return this.ventesService.findOne(id, this.getTenantId(req));
  }

  @Patch('ventes/:id/annuler')
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
  async getStats(@Req() req: any) {
    return this.ventesService.getStats(this.getTenantId(req));
  }

  // ── Factures (alias Vente PAYE) ─────────────────────────────────────────

  @Get('factures')
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
  async findOneFacture(@Param('id') id: string, @Req() req: any) {
    const vente = await this.ventesService.findOne(id, this.getTenantId(req));
    if (vente.statut !== 'PAYE') {
      throw new BadRequestException('Facture introuvable : vente non payée');
    }
    return vente;
  }

  // ── Catégories ────────────────────────────────────────────────────────────

  @Get('categories')
  getCategories(@Req() req: any, @Query() query: any) {
    return this.ventesService.findAllCategories(this.getTenantId(req), query);
  }


  @Get('categories/:id')
  getCategorie(@Req() req: any, @Param('id') id: string) {
    return this.ventesService.findOneCategorie(this.getTenantId(req), id);
  }

  @Post('categories')
  createCategorie(@Req() req: any, @Body() dto: any) {
    return this.ventesService.createCategorie(this.getTenantId(req), dto);
  }

  @Patch('categories/:id')
  updateCategorie(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.ventesService.updateCategorie(this.getTenantId(req), id, dto);
  }

  @Put('categories/:id')
  updateCategoriePut(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.ventesService.updateCategorie(this.getTenantId(req), id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  deleteCategorie(@Req() req: any, @Param('id') id: string) {
    return this.ventesService.deleteCategorie(this.getTenantId(req), id);
  }

  @Post('categories/seed/:typeBoutique')
  seedCategories(@Req() req: any, @Param('typeBoutique') typeBoutique: string) {
    return this.ventesService.seedCategoriesByType(
      this.getTenantId(req),
      typeBoutique,
    );
  }

  // ── Paramètres (stub) ─────────────────────────────────────────────────────

  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }

  @Patch('parametres')
  async updateParametresPatch(@Body() body: any) {
    return body;
  }
}
