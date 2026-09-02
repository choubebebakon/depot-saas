import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma.service';

interface ScopedRequest extends Request {
  user?: { tenantId?: string };
  depotScope?: { tenantId: string; depotId: string | null };
}

/**
 * Les promotions historiques sont rattachées au tenant et non directement au
 * dépôt. Pour empêcher une promotion d'un autre dépôt d'être lue/modifiée,
 * l'article doit néanmoins posséder un stock dans le dépôt actif.
 *
 * Le dépôt actif est exclusivement celui résolu par DepotScopeInterceptor.
 * Aucun header/query/body ne devient une autorité de sécurité ici.
 */
@Injectable()
export class PromotionScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  private isPromotionRoute(req: Request): boolean {
    const path = String(req.originalUrl || req.url || '').split('?')[0];
    return /(?:^|\/)promotions(?:\/[^/]+)?$/i.test(path);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<ScopedRequest>();
    if (!this.isPromotionRoute(req)) return next.handle();

    const tenantId = req.user?.tenantId;
    const depotId = req.depotScope?.depotId;
    if (!tenantId) {
      throw new BadRequestException('Contexte tenant manquant.');
    }
    if (!depotId) {
      throw new BadRequestException('Dépôt actif requis pour les promotions.');
    }

    const method = String(req.method || '').toUpperCase();
    const id = req.params?.id;
    const articleId = req.body?.articleId;

    if (method === 'POST') {
      if (!articleId) throw new BadRequestException('articleId requis pour une promotion.');
      await this.assertArticleInDepot(tenantId, depotId, articleId);
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new BadRequestException('Identifiant promotion requis.');
      const promotion = await this.prisma.promotion.findFirst({
        where: { id, tenantId },
        select: { id: true, articleId: true },
      });
      if (!promotion) throw new NotFoundException('Promotion introuvable.');
      await this.assertArticleInDepot(tenantId, depotId, articleId || promotion.articleId);
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
      mergeMap((result: unknown) =>
        from(this.filterListResult(result, method, tenantId, depotId)),
      ),
    );
  }

  private async filterListResult(
    result: unknown,
    method: string,
    tenantId: string,
    depotId: string,
  ): Promise<unknown> {
    if (method !== 'GET' || !Array.isArray(result)) return result;

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
  }

  private async assertArticleInDepot(
    tenantId: string,
    depotId: string,
    articleId: string,
  ): Promise<void> {
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
