import { Controller, Post, Get, Patch, Delete, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { DepotBoissonsService } from './depot-boissons.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('depot-boissons')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
export class DepotBoissonsController {
  constructor(private service: DepotBoissonsService) {}

  // ── Dashboard ─────────────────────────────────────────────
  @Get('dashboard')
  async getDashboard(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.getDashboardStats(req.user.tenantId, depotId);
  }

  // ── Articles ─────────────────────────────────────────────
  @Get('articles')
  async getArticles(@Req() req: any, @Query() query: any) {
    return this.service.getArticles(req.user.tenantId, { ...query, depotId: req.headers['x-depot-id'] });
  }

  @Get('articles/:id')
  async getArticle(@Req() req: any, @Param('id') id: string) {
    return this.service.getArticle(req.user.tenantId, id);
  }

  @Post('articles')
  async createArticle(@Req() req: any, @Body() data: any) {
    return this.service.createArticle(req.user.tenantId, data);
  }

  @Patch('articles/:id')
  async updateArticle(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.updateArticle(req.user.tenantId, id, data);
  }

  @Delete('articles/:id')
  async archiveArticle(@Req() req: any, @Param('id') id: string) {
    return this.service.archiveArticle(req.user.tenantId, id);
  }

  @Get('articles/:id/stock-history')
  async getStockHistory(@Req() req: any, @Param('id') id: string) {
    return this.service.getStockHistory(req.user.tenantId, id);
  }

  @Post('stock/entree')
  async entreStock(@Req() req: any, @Body() data: any) {
    return this.service.entreStock(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('stock/sortie')
  async sortieStock(@Req() req: any, @Body() data: any) {
    return this.service.sortieStock(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('stock/transfert')
  async transfertStock(@Req() req: any, @Body() data: any) {
    return this.service.transfertStock(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  // ── Conditionnements ─────────────────────────────────────
  @Get('conditionnements')
  async getConditionnements(@Req() req: any) {
    return this.service.getConditionnements(req.user.tenantId);
  }

  @Post('conditionnements')
  async createConditionnement(@Req() req: any, @Body() data: any) {
    return this.service.createConditionnement(req.user.tenantId, data);
  }

  @Patch('conditionnements/:id')
  async updateConditionnement(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.updateConditionnement(req.user.tenantId, id, data);
  }

  @Delete('conditionnements/:id')
  async deleteConditionnement(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteConditionnement(req.user.tenantId, id);
  }

  // ── Consignes ────────────────────────────────────────────
  @Get('consignes/client/:clientId')
  async getConsignesClient(@Req() req: any, @Param('clientId') clientId: string) {
    return this.service.getConsignesClient(req.user.tenantId, clientId);
  }

  @Post('consignes/sortie')
  async sortirConsigne(@Req() req: any, @Body() data: any) {
    return this.service.sortirConsigne(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('consignes/retour')
  async retourConsigne(@Req() req: any, @Body() data: any) {
    return this.service.retourConsigne(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('consignes/remboursement')
  async rembourserConsigne(@Req() req: any, @Body() data: any) {
    return this.service.rembourserConsigne(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Get('consignes/historique/:clientId')
  async historiqueConsignes(@Req() req: any, @Param('clientId') clientId: string) {
    return this.service.historiqueConsignes(req.user.tenantId, clientId);
  }

  // ── Livraisons ───────────────────────────────────────────
  @Get('livraisons')
  async getLivraisons(@Req() req: any, @Query() query: any) {
    return this.service.getLivraisons(req.user.tenantId, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Post('livraisons')
  async createLivraison(@Req() req: any, @Body() data: any) {
    return this.service.createLivraison(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Delete('livraisons/:id')
  async deleteLivraison(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteLivraison(req.user.tenantId, id);
  }

  // ── Tournées ─────────────────────────────────────────────
  @Get('tournees')
  async getTournees(@Req() req: any, @Query() query: any) {
    return this.service.getTournees(req.user.tenantId, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Post('tournees')
  async createTournee(@Req() req: any, @Body() data: any) {
    return this.service.createTournee(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('tournees/:id/demarrer')
  async demarrerTournee(@Req() req: any, @Param('id') id: string) {
    return this.service.demarrerTournee(req.user.tenantId, id);
  }

  @Post('tournees/:id/cloturer')
  async cloturerTournee(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.cloturerTournee(req.user.tenantId, id, data);
  }

  @Post('tournees/:id/charger')
  async chargerArticlesTournee(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.chargerArticlesTournee(req.user.tenantId, id, data);
  }

  @Get('tournees/:id/recap')
  async getRecapTournee(@Req() req: any, @Param('id') id: string) {
    return this.service.getRecapTournee(req.user.tenantId, id);
  }

  // ── Clients ──────────────────────────────────────────────
  @Get('clients')
  async getClients(@Req() req: any, @Query() query: any) {
    return this.service.getClients(req.user.tenantId, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Get('clients/:id')
  async getClient(@Req() req: any, @Param('id') id: string) {
    return this.service.getClient(req.user.tenantId, id);
  }

  @Post('clients')
  async createClient(@Req() req: any, @Body() data: any) {
    return this.service.createClient(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Patch('clients/:id')
  async updateClient(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.updateClient(req.user.tenantId, id, data);
  }

  @Post('clients/:id/payer-dette')
  async payerDette(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.payerDette(req.user.tenantId, id, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Get('clients/:id/historique-achats')
  async historiqueAchats(@Req() req: any, @Param('id') id: string, @Query() query: any) {
    return this.service.historiqueAchats(req.user.tenantId, id, query);
  }

  // ── Fournisseurs ─────────────────────────────────────────
  @Get('fournisseurs')
  async getFournisseurs(@Req() req: any, @Query() query: any) {
    return this.service.getFournisseurs(req.user.tenantId, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Get('fournisseurs/:id')
  async getFournisseur(@Req() req: any, @Param('id') id: string) {
    return this.service.getFournisseur(req.user.tenantId, id);
  }

  @Post('fournisseurs')
  async createFournisseur(@Req() req: any, @Body() data: any) {
    return this.service.createFournisseur(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Patch('fournisseurs/:id')
  async updateFournisseur(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.updateFournisseur(req.user.tenantId, id, data);
  }

  @Post('fournisseurs/commande')
  async passerCommandeFournisseur(@Req() req: any, @Body() data: any) {
    return this.service.passerCommandeFournisseur(req.user.tenantId, { ...data, userId: req.user.userId, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('fournisseurs/:id/receptionner')
  async receptionnerLivraison(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.receptionnerLivraison(req.user.tenantId, id, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('fournisseurs/:id/regler-dette')
  async reglerDetteFournisseur(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.reglerDetteFournisseur(req.user.tenantId, id, data);
  }

  @Get('fournisseurs/:id/historique-commandes')
  async historiqueCommandes(@Req() req: any, @Param('id') id: string) {
    return this.service.historiqueCommandes(req.user.tenantId, id);
  }

  // ── Ventes ───────────────────────────────────────────────
  @Get('ventes')
  async getVentes(@Req() req: any, @Query() query: any) {
    return this.service.getVentes(req.user.tenantId, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Get('ventes/:id')
  async getVente(@Req() req: any, @Param('id') id: string) {
    return this.service.getVente(req.user.tenantId, id);
  }

  @Post('ventes')
  async createVente(@Req() req: any, @Body() data: any) {
    return this.service.createVente(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] }, req.user.userId);
  }

  @Post('ventes/:id/annuler')
  async annulerVente(@Req() req: any, @Param('id') id: string, @Body('motif') motif?: string) {
    return this.service.annulerVente(req.user.tenantId, id, motif);
  }

  @Get('ventes/:id/ticket')
  async imprimerTicket(@Req() req: any, @Param('id') id: string) {
    return this.service.imprimerTicket(req.user.tenantId, id);
  }

  // ── Caisse ───────────────────────────────────────────────
  @Get('caisse/statut')
  async getCaisseStatut(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.getCaisseStatut(req.user.tenantId, depotId || req.headers['x-depot-id']);
  }

  @Post('caisse/ouvrir')
  async ouvrirCaisse(@Req() req: any, @Body() data: any) {
    return this.service.ouvrirCaisse(req.user.tenantId, { ...data, userId: req.user.userId, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('caisse/fermer')
  async fermerCaisse(@Req() req: any, @Body() data: any) {
    return this.service.fermerCaisse(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Post('caisse/mouvement')
  async mouvementCaisse(@Req() req: any, @Body() data: any) {
    return this.service.mouvementCaisse(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Get('caisse/rapport-journalier')
  async rapportJournalier(@Req() req: any, @Query('depotId') depotId?: string) {
    return this.service.rapportJournalier(req.user.tenantId, depotId || req.headers['x-depot-id']);
  }

  // ── Dépenses ─────────────────────────────────────────────
  @Get('depenses')
  async getDepenses(@Req() req: any, @Query() query: any) {
    return this.service.getDepenses(req.user.tenantId, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Post('depenses')
  async createDepense(@Req() req: any, @Body() data: any) {
    return this.service.createDepense(req.user.tenantId, { ...data, depotId: data.depotId || req.headers['x-depot-id'] });
  }

  @Delete('depenses/:id')
  async deleteDepense(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteDepense(req.user.tenantId, id);
  }

  // ── Rapports ─────────────────────────────────────────────
  @Get('rapports/:type')
  async getRapport(@Req() req: any, @Param('type') type: string, @Query() query: any) {
    return this.service.getRapport(req.user.tenantId, type, { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }

  @Get('rapports/:type/export')
  async exporterRapport(@Req() req: any, @Param('type') type: string, @Query() query: any) {
    return this.service.exporterRapport(req.user.tenantId, type, query.format || 'json', { ...query, depotId: query.depotId || req.headers['x-depot-id'] });
  }
}
