import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { TourneeWorkflowService } from './tournee-workflow.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

@Controller('depot-boissons/tournee-workflow')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
export class TourneeWorkflowController {
  constructor(private readonly service: TourneeWorkflowService) {}

  private scope(req: any) {
    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    if (!tenantId) throw new BadRequestException('tenantId manquant dans le token.');
    if (!depotId) throw new BadRequestException('Dépôt actif requis.');
    return { tenantId, depotId };
  }

  @Get()
  @RequirePermission('tournees', 'read')
  list(@Req() req: any) { const { tenantId, depotId } = this.scope(req); return this.service.list(tenantId, depotId); }

  @Get(':id')
  @RequirePermission('tournees', 'read')
  get(@Req() req: any, @Param('id') id: string) { const { tenantId, depotId } = this.scope(req); return this.service.get(tenantId, depotId, id); }

  @Post()
  @RequirePermission('tournees', 'write')
  create(@Req() req: any, @Body() data: any) { const { tenantId, depotId } = this.scope(req); return this.service.create(tenantId, depotId, data); }

  @Patch(':id')
  @RequirePermission('tournees', 'write')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) { const { tenantId, depotId } = this.scope(req); return this.service.update(tenantId, depotId, id, data); }

  @Post(':id/lignes')
  @RequirePermission('tournees', 'write')
  addLine(@Req() req: any, @Param('id') id: string, @Body() data: any) { const { tenantId, depotId } = this.scope(req); return this.service.addLine(tenantId, depotId, id, data); }

  @Delete(':id/lignes/:lineId')
  @RequirePermission('tournees', 'write')
  removeLine(@Req() req: any, @Param('id') id: string, @Param('lineId') lineId: string) { const { tenantId, depotId } = this.scope(req); return this.service.removeLine(tenantId, depotId, id, lineId); }

  @Post(':id/depart')
  @RequirePermission('tournees', 'write')
  depart(@Req() req: any, @Param('id') id: string) { const { tenantId, depotId } = this.scope(req); return this.service.depart(tenantId, depotId, id); }

  @Post(':id/reconciliation')
  @RequirePermission('tournees', 'write')
  reconcile(@Req() req: any, @Param('id') id: string, @Body() data: any) { const { tenantId, depotId } = this.scope(req); return this.service.reconcile(tenantId, depotId, id, data); }

  @Post(':id/cloture')
  @RequirePermission('tournees', 'write')
  close(@Req() req: any, @Param('id') id: string) { const { tenantId, depotId } = this.scope(req); return this.service.close(tenantId, depotId, id); }

  @Get('stock/:articleId')
  @RequirePermission('tournees', 'read')
  stock(@Req() req: any, @Param('articleId') articleId: string) { const { tenantId, depotId } = this.scope(req); return this.service.stock(tenantId, depotId, articleId); }

  @Get(':id/bon-sortie')
  @RequirePermission('tournees', 'read')
  async bonSortie(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const { tenantId, depotId } = this.scope(req);
    const tournee: any = await this.service.get(tenantId, depotId, id);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const money = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
    let y = 800;
    const text = (value: string, x = 45, size = 10, isBold = false) => { page.drawText(value, { x, y, size, font: isBold ? bold : font, color: rgb(0.08, 0.11, 0.16) }); y -= size + 7; };
    text('GESTOCK — BON DE SORTIE', 45, 18, true);
    text(`Référence : ${tournee.reference}`, 45, 11, true);
    text(`Date planifiée : ${new Date(tournee.datePlanifiee).toLocaleString('fr-FR')}`);
    text(`Commercial : ${tournee.commercial?.nom || tournee.commercial?.email || '-'}`);
    text(`Tricycle : ${tournee.tricycle?.nom || '-'}`);
    text(`Dépôt : ${tournee.depot?.nom || '-'}`);
    y -= 8;
    page.drawLine({ start: { x: 45, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y -= 18;
    page.drawText('Article', { x: 45, y, size: 9, font: bold });
    page.drawText('Qté', { x: 280, y, size: 9, font: bold });
    page.drawText('PU', { x: 350, y, size: 9, font: bold });
    page.drawText('Total', { x: 455, y, size: 9, font: bold });
    y -= 18;
    for (const line of tournee.lignes || []) {
      page.drawText(String(line.designation || '-').slice(0, 34), { x: 45, y, size: 9, font });
      page.drawText(String(line.quantiteChargee), { x: 280, y, size: 9, font });
      page.drawText(money(line.prixUnitaireFacture), { x: 350, y, size: 9, font });
      page.drawText(money(Number(line.quantiteChargee) * Number(line.prixUnitaireFacture)), { x: 455, y, size: 9, font });
      y -= 17;
    }
    y -= 5;
    text(`Total quantité : ${tournee.totalQuantiteChargee || 0}`, 45, 10, true);
    text(`Valeur totale : ${money(tournee.totalValeurChargee)}`, 45, 11, true);
    y -= 20;
    text('Signatures', 45, 11, true);
    page.drawText('Magasinier : ____________________', { x: 45, y, size: 9, font });
    page.drawText('Commercial : ____________________', { x: 300, y, size: 9, font });
    y -= 35;
    page.drawText('Responsable : ____________________', { x: 45, y, size: 9, font });
    const bytes = await pdf.save();
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="bon-sortie-${tournee.reference}.pdf"`, 'Content-Length': bytes.length });
    res.end(Buffer.from(bytes));
  }
}
