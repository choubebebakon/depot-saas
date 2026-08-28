import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DepotBoissonsService } from './depot-boissons.service';

/**
 * Adaptateur de persistance média pour le module Dépôt boissons.
 *
 * Le service métier historique reste la source de la logique métier.
 * Cet adaptateur ne modifie que le contrat média des articles :
 * - réhydrate photoUrl depuis PostgreSQL lors de la lecture ;
 * - ne détruit jamais une photo existante lors d'une modification qui
 *   n'envoie pas de nouvelle photo ;
 * - autorise explicitement null uniquement pour une suppression demandée.
 */
@Injectable()
export class DepotBoissonsMediaService extends DepotBoissonsService {
  constructor(private readonly prismaMedia: PrismaService) {
    super(prismaMedia);
  }

  override async getArticles(tenantId: string, query: any) {
    const result = await super.getArticles(tenantId, query);

    if (!Array.isArray(result?.data) || result.data.length === 0) {
      return result;
    }

    const ids = result.data
      .map((article: any) => article?.id)
      .filter(
        (id: unknown): id is string =>
          typeof id === 'string' && id.trim().length > 0,
      );

    if (ids.length === 0) return result;

    const persisted = await this.prismaMedia.article.findMany({
      where: {
        tenantId,
        id: { in: ids },
      },
      select: {
        id: true,
        photoUrl: true,
      },
    });

    const photos = new Map(
      persisted.map((article) => [article.id, article.photoUrl]),
    );

    return {
      ...result,
      data: result.data.map((article: any) => ({
        ...article,
        photoUrl: photos.get(article.id) ?? null,
      })),
    };
  }

  override async updateArticle(tenantId: string, id: string, data: any) {
    const payload = { ...(data ?? {}) };

    // Le frontend peut envoyer photoUrl absent ou vide lorsqu'aucune
    // nouvelle image n'a été sélectionnée. Dans ce cas, Prisma ne doit
    // surtout pas écraser la valeur déjà persistée.
    if (payload.photoUrl === undefined || payload.photoUrl === '') {
      delete payload.photoUrl;
    } else if (typeof payload.photoUrl === 'string') {
      payload.photoUrl = payload.photoUrl.trim();

      if (!payload.photoUrl) {
        delete payload.photoUrl;
      }
    }

    // null reste volontaire : il représente une demande explicite de
    // suppression de la photo.
    return super.updateArticle(tenantId, id, payload);
  }
}
