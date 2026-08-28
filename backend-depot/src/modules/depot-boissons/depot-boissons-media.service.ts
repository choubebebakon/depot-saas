import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DepotBoissonsService } from './depot-boissons.service';

/**
 * Adaptateur de persistance média pour le module Dépôt boissons.
 *
 * Le service métier historique reste la source de la logique métier.
 * Cet adaptateur corrige uniquement le contrat de lecture des articles :
 * photoUrl est explicitement réhydraté depuis PostgreSQL avant de retourner
 * la collection au frontend.
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
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);

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

    const photos = new Map(persisted.map((article) => [article.id, article.photoUrl]));

    return {
      ...result,
      data: result.data.map((article: any) => ({
        ...article,
        // Toujours retourner explicitement le champ attendu par le frontend.
        photoUrl: photos.get(article.id) ?? null,
      })),
    };
  }
}
