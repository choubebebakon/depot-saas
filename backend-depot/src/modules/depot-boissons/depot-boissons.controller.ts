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

  // ── Dashboard ─────────────────────────────────────────────
  @Get('dashboard')
  @RequirePermission('dashboard', 'read')
  async getDashboard(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.getDashboardStats(req.user.tenantId, depotId);
  }

  // ── Articles ─────────────────────────────────────────────
  @Get('articles')
  @RequirePermission('stock_articles', 'read')
  async getArticles(@Req() req: any, @Query() query: any) {
    return this.service.getArticles(req.user.tenantId, {
      ...query,
      depotId: req.headers['x-depot-id'],
    });
  }

  @Get('articles/:id')
  @RequirePermission('stock_articles', 'read')
  async getArticle(@Req() req: any, @Param('id') id: string) {
    return this.service.getArticle(req.user.tenantId, id);
  }

  @Post('articles')
  @RequirePermission('stock_articles', 'write')
  async createArticle(@Req() req: any, @Body() data: any) {
    return this.service.createArticle(req.user.tenantId, data);
  }

  @Patch('articles/:id')
  @RequirePermission('stock_articles', 'write')
  async updateArticle(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.updateArticle(req.user.tenantId, id, data);
  }

  @Delete('articles/:id')
  @RequirePermission('stock_articles', 'write')
  async archiveArticle(@Req() req: any, @Param('id') id: string) {
    return this.service.archiveArticle(req.user.tenantId, id);
  }

  @Get('articles/:id/stock-history')
  @RequirePermission('stock_articles', 'read')
  async getStockHistory(@Req() req: any, @Param('id') id: string) {
    return this.service.getStockHistory(req.user.tenantId, id);
  }

  @Post('stock/entree')
  @RequirePermission('stock_articles', 'write')
  async entreStock(@Req() req: any, @Body() data: any) {
    return this.service.entreStock(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('stock/sortie')
  @RequirePermission('stock_articles', 'write')
  async sortieStock(@Req() req: any, @Body() data: any) {
    return this.service.sortieStock(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('stock/transfert')
  @RequirePermission('stock_articles', 'write')
  async transfertStock(@Req() req: any, @Body() data: any) {
    return this.service.transfertStock(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  // ── Conditionnements ─────────────────────────────────────
  @Get('conditionnements')
  @RequirePermission('stock_articles', 'read')
  async getConditionnements(@Req() req: any) {
    return this.service.getConditionnements(req.user.tenantId);
  }

  @Post('conditionnements')
  @RequirePermission('stock_articles', 'write')
  async createConditionnement(@Req() req: any, @Body() data: any) {
    return this.service.createConditionnement(req.user.tenantId, data);
  }

  @Patch('conditionnements/:id')
  @RequirePermission('stock_articles', 'write')
  async updateConditionnement(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.updateConditionnement(req.user.tenantId, id, data);
  }

  @Delete('conditionnements/:id')
  @RequirePermission('stock_articles', 'write')
  async deleteConditionnement(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteConditionnement(req.user.tenantId, id);
  }

  // ── Consignes ────────────────────────────────────────────
  @Get('consignes/client/:clientId')
  @RequirePermission('consignes', 'read')
  async getConsignesClient(
    @Req() req: any,
    @Param('clientId') clientId: string,
  ) {
    return this.service.getConsignesClient(req.user.tenantId, clientId);
  }

  @Post('consignes/sortie')
  @RequirePermission('consignes', 'write')
  async sortirConsigne(@Req() req: any, @Body() data: any) {
    return this.service.sortirConsigne(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('consignes/retour')
  @RequirePermission('consignes', 'write')
  async retourConsigne(@Req() req: any, @Body() data: any) {
    return this.service.retourConsigne(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('consignes/remboursement')
  @RequirePermission('consignes', 'write')
  async rembourserConsigne(@Req() req: any, @Body() data: any) {
    return this.service.rembourserConsigne(req.user.tenantId, {
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
    return this.service.historiqueConsignes(req.user.tenantId, clientId);
  }

  // ── Livraisons ───────────────────────────────────────────
  @Get('livraisons')
  @RequirePermission('livraisons', 'read')
  async getLivraisons(@Req() req: any, @Query() query: any) {
    return this.service.getLivraisons(req.user.tenantId, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('livraisons')
  @RequirePermission('livraisons', 'write')
  async createLivraison(@Req() req: any, @Body() data: any) {
    return this.service.createLivraison(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Delete('livraisons/:id')
  @RequirePermission('livraisons', 'write')
  async deleteLivraison(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteLivraison(req.user.tenantId, id);
  }

  // ── Tournées ─────────────────────────────────────────────
  @Get('tournees')
  @RequirePermission('tournees', 'read')
  async getTournees(@Req() req: any, @Query() query: any) {
    return this.service.getTournees(req.user.tenantId, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('tournees')
  @RequirePermission('tournees', 'write')
  async createTournee(@Req() req: any, @Body() data: any) {
    return this.service.createTournee(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('tournees/:id/demarrer')
  @RequirePermission('tournees', 'write')
  async demarrerTournee(@Req() req: any, @Param('id') id: string) {
    return this.service.demarrerTournee(req.user.tenantId, id);
  }

  @Post('tournees/:id/cloturer')
  @RequirePermission('tournees', 'write')
  async cloturerTournee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.cloturerTournee(req.user.tenantId, id, data);
  }

  @Post('tournees/:id/charger')
  @RequirePermission('tournees', 'write')
  async chargerArticlesTournee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.chargerArticlesTournee(req.user.tenantId, id, data);
  }

  @Get('tournees/:id/recap')
  @RequirePermission('tournees', 'read')
  async getRecapTournee(@Req() req: any, @Param('id') id: string) {
    return this.service.getRecapTournee(req.user.tenantId, id);
  }

  // ── Clients ──────────────────────────────────────────────
  @Get('clients')
  @RequirePermission('clients', 'read')
  async getClients(@Req() req: any, @Query() query: any) {
    return this.service.getClients(req.user.tenantId, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('clients/:id')
  @RequirePermission('clients', 'read')
  async getClient(@Req() req: any, @Param('id') id: string) {
    return this.service.getClient(req.user.tenantId, id);
  }

  @Post('clients')
  @RequirePermission('clients', 'write')
  async createClient(@Req() req: any, @Body() data: any) {
    return this.service.createClient(req.user.tenantId, {
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
    return this.service.updateClient(req.user.tenantId, id, data);
  }

  @Post('clients/:id/payer-dette')
  @RequirePermission('clients', 'write')
  async payerDette(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.service.payerDette(req.user.tenantId, id, {
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
    return this.service.historiqueAchats(req.user.tenantId, id, query);
  }

  // ── Fournisseurs ─────────────────────────────────────────
  @Get('fournisseurs')
  @RequirePermission('fournisseurs', 'read')
  async getFournisseurs(@Req() req: any, @Query() query: any) {
    return this.service.getFournisseurs(req.user.tenantId, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('fournisseurs/:id')
  @RequirePermission('fournisseurs', 'read')
  async getFournisseur(@Req() req: any, @Param('id') id: string) {
    return this.service.getFournisseur(req.user.tenantId, id);
  }

  @Post('fournisseurs')
  @RequirePermission('fournisseurs', 'write')
  async createFournisseur(@Req() req: any, @Body() data: any) {
    return this.service.createFournisseur(req.user.tenantId, {
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
    return this.service.updateFournisseur(req.user.tenantId, id, data);
  }

  @Post('fournisseurs/commande')
  @RequirePermission('fournisseurs', 'write')
  async passerCommandeFournisseur(@Req() req: any, @Body() data: any) {
    return this.service.passerCommandeFournisseur(req.user.tenantId, {
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
    return this.service.receptionnerLivraison(req.user.tenantId, id, {
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
    return this.service.reglerDetteFournisseur(req.user.tenantId, id, data);
  }

  @Get('fournisseurs/:id/historique-commandes')
  @RequirePermission('fournisseurs', 'read')
  async historiqueCommandes(@Req() req: any, @Param('id') id: string) {
    return this.service.historiqueCommandes(req.user.tenantId, id);
  }

  // ── Ventes ───────────────────────────────────────────────
  @Get('ventes')
  @RequirePermission('ventes', 'read')
  async getVentes(@Req() req: any, @Query() query: any) {
    return this.service.getVentes(req.user.tenantId, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('ventes/:id')
  @RequirePermission('ventes', 'read')
  async getVente(@Req() req: any, @Param('id') id: string) {
    return this.service.getVente(req.user.tenantId, id);
  }

  @Post('ventes')
  @RequirePermission('ventes', 'write')
  async createVente(@Req() req: any, @Body() data: any) {
    return this.service.createVente(
      req.user.tenantId,
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
    return this.service.annulerVente(req.user.tenantId, id, motif);
  }

  @Get('ventes/:id/ticket')
  @RequirePermission('ventes', 'read')
  async imprimerTicket(@Req() req: any, @Param('id') id: string) {
    return this.service.imprimerTicket(req.user.tenantId, id);
  }

  // ── Caisse ───────────────────────────────────────────────
  @Get('caisse/statut')
  @RequirePermission('caisse', 'read')
  async getCaisseStatut(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.getCaisseStatut(
      req.user.tenantId,
      depotId || req.headers['x-depot-id'],
    );
  }

  @Post('caisse/ouvrir')
  @RequirePermission('caisse', 'write')
  async ouvrirCaisse(@Req() req: any, @Body() data: any) {
    return this.service.ouvrirCaisse(req.user.tenantId, {
      ...data,
      userId: req.user.userId,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('caisse/fermer')
  @RequirePermission('caisse', 'write')
  async fermerCaisse(@Req() req: any, @Body() data: any) {
    return this.service.fermerCaisse(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('caisse/mouvement')
  @RequirePermission('caisse', 'write')
  async mouvementCaisse(@Req() req: any, @Body() data: any) {
    return this.service.mouvementCaisse(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Get('caisse/rapport-journalier')
  @RequirePermission('caisse', 'read')
  async rapportJournalier(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.rapportJournalier(
      req.user.tenantId,
      depotId || req.headers['x-depot-id'],
    );
  }

  // ── Dépenses ─────────────────────────────────────────────
  @Get('depenses')
  @RequirePermission('depenses', 'read')
  async getDepenses(@Req() req: any, @Query() query: any) {
    return this.service.getDepenses(req.user.tenantId, {
      ...query,
      depotId: query.depotId || req.headers['x-depot-id'],
    });
  }

  @Post('depenses')
  @RequirePermission('depenses', 'write')
  async createDepense(@Req() req: any, @Body() data: any) {
    return this.service.createDepense(req.user.tenantId, {
      ...data,
      depotId: data.depotId || req.headers['x-depot-id'],
    });
  }

  @Delete('depenses/:id')
  @RequirePermission('depenses', 'write')
  async deleteDepense(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteDepense(req.user.tenantId, id);
  }

  // ── Rapports ─────────────────────────────────────────────
  @Get('rapports/:type')
  @RequirePermission('rapports', 'read')
  async getRapport(
    @Req() req: any,
    @Param('type') type: string,
    @Query() query: any,
  ) {
    return this.service.getRapport(req.user.tenantId, type, {
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
      req.user.tenantId,
      type,
      query.format || 'json',
      { ...query, depotId: query.depotId || req.headers['x-depot-id'] },
    );
  }
}
