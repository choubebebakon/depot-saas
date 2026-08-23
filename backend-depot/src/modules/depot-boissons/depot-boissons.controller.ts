import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { DepotBoissonsService } from './depot-boissons.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@Controller('depot-boissons')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
export class DepotBoissonsController {
  constructor(private service: DepotBoissonsService) {}

  private getTenantId(req: any): string {
    if (!req.user?.tenantId) {
      throw new BadRequestException('AccÃ¨s refusÃ© : tenantId manquant dans le token.');
    }
    return req.user.tenantId;
  }

  // â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('dashboard')
  @RequirePermission('dashboard', 'read')
  async getDashboard(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.getDashboardStats(this.getTenantId(req), depotId);
  }

  // â”€â”€ Articles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('articles')
  @RequirePermission('stock_articles', 'read')
  async getArticles(@Req() req: any, @Query() query: any) {
    return this.service.getArticles(this.getTenantId(req), {
      ...query,
      depotId: req.headers['x-depot-id'],
    });
  }

  @Get('articles/:id')
  @RequirePermission('stock_articles', 'read')
  async getArticle(@Req() req: any, @Param('id') id: string) {
    return this.service.getArticle(this.getTenantId(req), id);
  }

  @Post('articles')
  @RequirePermission('stock_articles', 'write')
  async createArticle(@Req() req: any, @Body() data: any) {
    return this.service.createArticle(this.getTenantId(req), data);
  }

  @Patch('articles/:id')
  @RequirePermission('stock_articles', 'write')
  async updateArticle(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.updateArticle(this.getTenantId(req), id, data);
  }

  @Delete('articles/:id')
  @RequirePermission('stock_articles', 'write')
  async archiveArticle(@Req() req: any, @Param('id') id: string) {
    return this.service.archiveArticle(this.getTenantId(req), id);
  }

  @Get('articles/:id/stock-history')
  @RequirePermission('stock_articles', 'read')
  async getStockHistory(@Req() req: any, @Param('id') id: string) {
    return this.service.getStockHistory(this.getTenantId(req), id);
  }

  @Post('stock/entree')
  @RequirePermission('stock_articles', 'write')
  async entreStock(@Req() req: any, @Body() data: any) {
    return this.service.entreStock(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('stock/sortie')
  @RequirePermission('stock_articles', 'write')
  async sortieStock(@Req() req: any, @Body() data: any) {
    return this.service.sortieStock(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('stock/transfert')
  @RequirePermission('stock_articles', 'write')
  async transfertStock(@Req() req: any, @Body() data: any) {
    return this.service.transfertStock(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  // â”€â”€ Conditionnements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('conditionnements')
  @RequirePermission('stock_articles', 'read')
  async getConditionnements(@Req() req: any) {
    return this.service.getConditionnements(this.getTenantId(req));
  }

  @Post('conditionnements')
  @RequirePermission('stock_articles', 'write')
  async createConditionnement(@Req() req: any, @Body() data: any) {
    return this.service.createConditionnement(this.getTenantId(req), data);
  }

  @Patch('conditionnements/:id')
  @RequirePermission('stock_articles', 'write')
  async updateConditionnement(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.updateConditionnement(this.getTenantId(req), id, data);
  }

  @Delete('conditionnements/:id')
  @RequirePermission('stock_articles', 'write')
  async deleteConditionnement(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteConditionnement(this.getTenantId(req), id);
  }

  // â”€â”€ Consignes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('consignes/client/:clientId')
  @RequirePermission('consignes', 'read')
  async getConsignesClient(
    @Req() req: any,
    @Param('clientId') clientId: string,
  ) {
    return this.service.getConsignesClient(this.getTenantId(req), clientId);
  }

  @Post('consignes/sortie')
  @RequirePermission('consignes', 'write')
  async sortirConsigne(@Req() req: any, @Body() data: any) {
    return this.service.sortirConsigne(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('consignes/retour')
  @RequirePermission('consignes', 'write')
  async retourConsigne(@Req() req: any, @Body() data: any) {
    return this.service.retourConsigne(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('consignes/remboursement')
  @RequirePermission('consignes', 'write')
  async rembourserConsigne(@Req() req: any, @Body() data: any) {
    return this.service.rembourserConsigne(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('consignes/historique/:clientId')
  @RequirePermission('consignes', 'read')
  async historiqueConsignes(
    @Req() req: any,
    @Param('clientId') clientId: string,
  ) {
    return this.service.historiqueConsignes(this.getTenantId(req), clientId);
  }

  // â”€â”€ Livraisons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('livraisons')
  @RequirePermission('livraisons', 'read')
  async getLivraisons(@Req() req: any, @Query() query: any) {
    return this.service.getLivraisons(this.getTenantId(req), {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('livraisons')
  @RequirePermission('livraisons', 'write')
  async createLivraison(@Req() req: any, @Body() data: any) {
    return this.service.createLivraison(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Delete('livraisons/:id')
  @RequirePermission('livraisons', 'write')
  async deleteLivraison(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteLivraison(this.getTenantId(req), id);
  }

  // â”€â”€ TournÃ©es â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('tournees')
  @RequirePermission('tournees', 'read')
  async getTournees(@Req() req: any, @Query() query: any) {
    return this.service.getTournees(this.getTenantId(req), {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('tournees')
  @RequirePermission('tournees', 'write')
  async createTournee(@Req() req: any, @Body() data: any) {
    return this.service.createTournee(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('tournees/:id/demarrer')
  @RequirePermission('tournees', 'write')
  async demarrerTournee(@Req() req: any, @Param('id') id: string) {
    return this.service.demarrerTournee(this.getTenantId(req), id);
  }

  @Post('tournees/:id/cloturer')
  @RequirePermission('tournees', 'write')
  async cloturerTournee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.cloturerTournee(this.getTenantId(req), id, data);
  }

  @Post('tournees/:id/charger')
  @RequirePermission('tournees', 'write')
  async chargerArticlesTournee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.chargerArticlesTournee(this.getTenantId(req), id, data);
  }

  @Get('tournees/:id/recap')
  @RequirePermission('tournees', 'read')
  async getRecapTournee(@Req() req: any, @Param('id') id: string) {
    return this.service.getRecapTournee(this.getTenantId(req), id);
  }

  // â”€â”€ Clients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('clients')
  @RequirePermission('clients', 'read')
  async getClients(@Req() req: any, @Query() query: any) {
    return this.service.getClients(this.getTenantId(req), {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('clients/:id')
  @RequirePermission('clients', 'read')
  async getClient(@Req() req: any, @Param('id') id: string) {
    return this.service.getClient(this.getTenantId(req), id);
  }

  @Post('clients')
  @RequirePermission('clients', 'write')
  async createClient(@Req() req: any, @Body() data: any) {
    return this.service.createClient(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Patch('clients/:id')
  @RequirePermission('clients', 'write')
  async updateClient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.updateClient(this.getTenantId(req), id, data);
  }

  @Post('clients/:id/payer-dette')
  @RequirePermission('clients', 'write')
  async payerDette(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.payerDette(this.getTenantId(req), id, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('clients/:id/historique-achats')
  @RequirePermission('clients', 'read')
  async historiqueAchats(
    @Req() req: any,
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.service.historiqueAchats(this.getTenantId(req), id, query);
  }

  // â”€â”€ Fournisseurs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('fournisseurs')
  @RequirePermission('fournisseurs', 'read')
  async getFournisseurs(@Req() req: any, @Query() query: any) {
    return this.service.getFournisseurs(this.getTenantId(req), {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'read')
  async getFournisseur(@Req() req: any, @Param('id') id: string) {
    return this.service.getFournisseur(this.getTenantId(req), id);
  }

  @Post('fournisseurs')
  @RequirePermission('fournisseurs', 'write')
  async createFournisseur(@Req() req: any, @Body() data: any) {
    return this.service.createFournisseur(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Patch('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'write')
  async updateFournisseur(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.updateFournisseur(this.getTenantId(req), id, data);
  }

  @Post('fournisseurs/commande')
  @RequirePermission('fournisseurs', 'write')
  async passerCommandeFournisseur(@Req() req: any, @Body() data: any) {
    return this.service.passerCommandeFournisseur(this.getTenantId(req), {
      ...data,
      userId: req.user.userId,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('fournisseurs/:id/receptionner')
  @RequirePermission('fournisseurs', 'write')
  async receptionnerLivraison(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.receptionnerLivraison(this.getTenantId(req), id, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('fournisseurs/:id/regler-dette')
  @RequirePermission('fournisseurs', 'write')
  async reglerDetteFournisseur(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.reglerDetteFournisseur(this.getTenantId(req), id, data);
  }

  @Get('fournisseurs/:id/historique-commandes')
  @RequirePermission('fournisseurs', 'read')
  async historiqueCommandes(@Req() req: any, @Param('id') id: string) {
    return this.service.historiqueCommandes(this.getTenantId(req), id);
  }

  // â”€â”€ Ventes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('ventes')
  @RequirePermission('ventes', 'read')
  async getVentes(@Req() req: any, @Query() query: any) {
    return this.service.getVentes(this.getTenantId(req), {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('ventes/:id')
  @RequirePermission('ventes', 'read')
  async getVente(@Req() req: any, @Param('id') id: string) {
    return this.service.getVente(this.getTenantId(req), id);
  }

  @Post('ventes')
  @RequirePermission('ventes', 'write')
  async createVente(@Req() req: any, @Body() data: any) {
    return this.service.createVente(
      this.getTenantId(req),
      { ...data, depotId: data.depotId || req.headers['x-depot-id'] },
      req.user.userId,
    );
  }

  @Post('ventes/:id/annuler')
  @RequirePermission('ventes', 'write')
  async annulerVente(
    @Req() req: any,
    @Param('id') id: string,
    @Body('motif') motif?: string,
  ) {
    return this.service.annulerVente(this.getTenantId(req), id, motif);
  }

  @Get('ventes/:id/ticket')
  @RequirePermission('ventes', 'read')
  async imprimerTicket(@Req() req: any, @Param('id') id: string) {
    return this.service.imprimerTicket(this.getTenantId(req), id);
  }

  // â”€â”€ Caisse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('caisse/statut')
  @RequirePermission('caisse', 'read')
  async getCaisseStatut(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.getCaisseStatut(
      this.getTenantId(req),
      depotId || req.headers['x-depot-id'],
    );
  }

  @Post('caisse/ouvrir')
  @RequirePermission('caisse', 'write')
  async ouvrirCaisse(@Req() req: any, @Body() data: any) {
    return this.service.ouvrirCaisse(this.getTenantId(req), {
      ...data,
      userId: req.user.userId,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('caisse/fermer')
  @RequirePermission('caisse', 'write')
  async fermerCaisse(@Req() req: any, @Body() data: any) {
    return this.service.fermerCaisse(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('caisse/mouvement')
  @RequirePermission('caisse', 'write')
  async mouvementCaisse(@Req() req: any, @Body() data: any) {
    return this.service.mouvementCaisse(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('caisse/rapport-journalier')
  @RequirePermission('caisse', 'read')
  async rapportJournalier(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.rapportJournalier(
      this.getTenantId(req),
      depotId || req.headers['x-depot-id'],
    );
  }

  // â”€â”€ DÃ©penses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('depenses')
  @RequirePermission('depenses', 'read')
  async getDepenses(@Req() req: any, @Query() query: any) {
    return this.service.getDepenses(this.getTenantId(req), {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('depenses')
  @RequirePermission('depenses', 'write')
  async createDepense(@Req() req: any, @Body() data: any) {
    return this.service.createDepense(this.getTenantId(req), {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Delete('depenses/:id')
  @RequirePermission('depenses', 'write')
  async deleteDepense(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteDepense(this.getTenantId(req), id);
  }

  // â”€â”€ Rapports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('rapports/:type')
  @RequirePermission('rapports', 'read')
  async getRapport(
    @Req() req: any,
    @Param('type') type: string,
    @Query() query: any,
  ) {
    return this.service.getRapport(this.getTenantId(req), type, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('rapports/:type/export')
  @RequirePermission('rapports', 'read')
  async exporterRapport(
    @Req() req: any,
    @Param('type') type: string,
    @Query() query: any,
  ) {
    return this.service.exporterRapport(
      this.getTenantId(req),
      type,
      query.format || 'json',
      { ...query, depotId: query.depotId || req.headers['x-depot-id'] },
    );
  }
}


