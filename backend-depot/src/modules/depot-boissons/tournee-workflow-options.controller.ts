import { BadRequestException, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('depot-boissons/tournee-workflow-options')
@Metier(MetierType.DEPOT_BOISSONS)
@UseGuards(JwtAuthGuard, MetierGuard)
export class TourneeWorkflowOptionsController {
  constructor(private readonly prisma: PrismaService) {}

  private scope(req: any) {
    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    if (!tenantId) throw new BadRequestException('tenantId manquant dans le token.');
    if (!depotId) throw new BadRequestException('Dépôt actif requis.');
    return { tenantId, depotId };
  }

  @Get('tricycles')
  @RequirePermission('tournees', 'read')
  async tricycles(@Req() req: any) {
    const { tenantId, depotId } = this.scope(req);
    return this.prisma.tricycle.findMany({ where: { tenantId, depotId, estLibre: true }, orderBy: { nom: 'asc' }, select: { id: true, nom: true, estLibre: true } });
  }

  @Get('commerciaux')
  @RequirePermission('tournees', 'read')
  async commerciaux(@Req() req: any) {
    const { tenantId, depotId } = this.scope(req);
    return this.prisma.user.findMany({ where: { tenantId, depotId, role: 'COMMERCIAL', isActive: true }, orderBy: { nom: 'asc' }, select: { id: true, nom: true, email: true, telephone: true } });
  }

  @Get('articles')
  @RequirePermission('tournees', 'read')
  async articles(@Req() req: any) {
    const { tenantId, depotId } = this.scope(req);
    const articles = await this.prisma.article.findMany({ where: { tenantId }, orderBy: { designation: 'asc' }, select: { id: true, designation: true, format: true, prixVente: true } });
    const stocks = await this.prisma.stock.findMany({ where: { depotId }, select: { articleId: true, quantite: true } });
    const byArticle = new Map(stocks.map((stock) => [stock.articleId, stock.quantite]));
    return articles.map((article) => ({ ...article, quantiteDisponible: byArticle.get(article.id) ?? 0 }));
  }
}
