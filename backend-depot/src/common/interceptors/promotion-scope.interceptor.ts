import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma.service';

/**
 * Enforce le périmètre dépôt sur les routes Promotions existantes.
 *
 * Le modèle Promotion historique est rattaché au tenant, pas directement au
 * dépôt. On ne prétend donc pas créer une fausse colonne depotId : le périmètre
 * autorisé est déterminé par l'article et son stock dans le dépôt actif.
 *
 * Toute promotion manipulée doit donc :
 *   tenantId authentifié + article appartenant au tenant + stock de l'article
 *   dans le dépôt actif.
 */
@Injectable()
export class PromotionScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  private getDepotId(req: any): string {
    const raw = req.headers?.['x-depot-id'];
    const depotId = Array.isArray(raw) ? raw[0] : raw;
    if (!depotId || ['undefined', 'null', 'all'].includes(String(depotId))) {
      throw new BadRequestException('Dépôt actif requis pour les promotions.');
    }
    return String(depotId);
  }

  private getTenantId(req: any): string {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId manquant dans le contexte authentifié.');
    }
    return tenantId;
  }

  private isPromotionRoute(req: any): boolean {
    const path = String(req.originalUrl || req.url || '').split('?')[0];
    return /^\/api\/v1\/supermarche\/promotions(?:\/[^/]+)?$/.test(path)
      || /^\/supermarche\/promotions(?:\/[^/]+)?$/.test(path);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    if (!this.isPromotionRoute(req)) return next.handle();

    const tenantId = this.getTenantId(req);
    const depotId = this.getDepotId(req);
    const method = String(req.method || '').toUpperCase();
    const id = req.params?.id;
    const articleId = req.body?.articleId;

    if (method === 'POST') {
      if (!articleId) throw new BadRequestException('articleId requis pour une promotion.');
      await this.assertArticleInDepot(tenantId, depotId, articleId);
    }

    if (method === 'PATCH') {
      if (!id) throw new BadRequestException('Identifiant promotion requis.');
      const promotion = await this.prisma.promotion.findFirst({
        where: { id, tenantId },
        select: { id: true, articleId: true },
      });
      if (!promotion) throw new NotFoundException('Promotion introuvable.');
      await this.assertArticleInDepot(tenantId, depotId, req.body?.articleId || promotion.articleId);
    }

    if (method === 'DELETE' || method === 'GET') {
      if (id) {
        const promotion = await this.prisma.promotion.findFirst({
          where: { id, tenantId },
          select: { id: true, articleId: true },
        });
        if (!promotion) throw new NotFoundException('Promotion introuvable.');
        await this.assertArticleInDepot(tenantId, depotId, promotion.articleId);
      }
    }

    return next.handle().pipe(
      mergeMap(async (result) => {
        if (method !== 'GET' || id || !Array.isArray(result)) return result;

        const articleIds = result
          .map((promotion: any) => promotion?.articleId)
          .filter(Boolean);
        if (!articleIds.length) return result;

        const stocks = await this.prisma.stock.findMany({
          where: {
            depotId,
            articleId: { in: articleIds },
            article: { tenantId },
          },
          select: { articleId: true },
        });
        const allowed = new Set(stocks.map((stock) => stock.articleId));
        return result.filter((promotion: any) => allowed.has(promotion.articleId));
      }),
    );
  }

  private async assertArticleInDepot(tenantId: string, depotId: string, articleId: string) {
    const article = await this.prisma.article.findFirst({
      where: {
        id: articleId,
        tenantId,
        stocks: { some: { depotId } },
      },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('Article introuvable dans le dépôt actif.');
    }
  }
}
