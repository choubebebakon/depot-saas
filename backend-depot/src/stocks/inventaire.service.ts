import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealiserInventaireDto } from './dto/realiser-inventaire.dto';

@Injectable()
export class InventaireService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private normalizeDepotId(depotId?: string) {
    const value = depotId?.trim();
    if (!value) {
      throw new BadRequestException('Un dépôt actif est obligatoire pour réaliser un inventaire.');
    }
    return value;
  }

  private normalizeLines(dto: RealiserInventaireDto) {
    if (!dto?.lignes?.length) {
      throw new BadRequestException('L’inventaire doit contenir au moins une ligne.');
    }

    const ids = dto.lignes.map((line) => line.articleId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Un article ne peut apparaître qu’une seule fois dans un inventaire.');
    }

    return dto.lignes.map((line) => ({
      articleId: line.articleId,
      quantiteComptee: line.quantiteComptee,
    }));
  }

  private async assertDepotAccess(tenantId: string, depotId: string, actor: any) {
    const depot = await this.prisma.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true, nom: true, tenantId: true },
    });

    if (!depot) {
      throw new NotFoundException('Dépôt introuvable, archivé ou inaccessible.');
    }

    if (actor?.role !== 'PATRON' && actor?.depotId !== depotId) {
      throw new ForbiddenException('Vous ne pouvez réaliser un inventaire que dans votre dépôt autorisé.');
    }

    return depot;
  }

  async getInventaire(tenantId: string, depotId: string, search?: string) {
    const selectedDepotId = this.normalizeDepotId(depotId);
    await this.assertDepotAccess(tenantId, selectedDepotId, { role: 'PATRON' });

    const normalizedSearch = search?.trim();
    if (normalizedSearch && normalizedSearch.length > 120) {
      throw new BadRequestException('La recherche est trop longue.');
    }

    return this.prisma.stock.findMany({
      where: {
        depotId: selectedDepotId,
        depot: { tenantId, isArchived: false },
        ...(normalizedSearch
          ? {
              article: {
                tenantId,
                designation: { contains: normalizedSearch, mode: 'insensitive' },
              },
            }
          : { article: { tenantId } }),
      },
      select: {
        id: true,
        articleId: true,
        quantite: true,
        seuilCritique: true,
        article: {
          select: {
            id: true,
            designation: true,
            format: true,
            codeBarres: true,
            unite: true,
            seuilCritique: true,
          },
        },
      },
      orderBy: { article: { designation: 'asc' } },
    });
  }

  async realiserInventaire(
    tenantId: string,
    depotId: string,
    dto: RealiserInventaireDto,
    actor: { userId: string; email: string; role: string; depotId?: string },
  ) {
    const selectedDepotId = this.normalizeDepotId(depotId);
    const lines = this.normalizeLines(dto);
    const depot = await this.assertDepotAccess(tenantId, selectedDepotId, actor);

    const articleIds = lines.map((line) => line.articleId);
    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds }, tenantId },
      select: { id: true, designation: true },
    });

    if (articles.length !== articleIds.length) {
      const found = new Set(articles.map((article) => article.id));
      const missing = articleIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Article(s) introuvable(s) ou hors tenant : ${missing.join(', ')}`);
    }

    const articleById = new Map(articles.map((article) => [article.id, article]));
    const reference = `INV-${Date.now()}-${actor.userId.slice(0, 8)}`;
    const reason = dto.motif?.trim().slice(0, 500) || 'Inventaire physique';

    const result = await this.prisma.$transaction(async (tx) => {
      const changes: Array<{
        articleId: string;
        designation: string;
        ancienneQuantite: number;
        quantiteComptee: number;
        difference: number;
      }> = [];

      for (const line of lines) {
        // Verrou applicatif PostgreSQL : deux inventaires concurrents sur la même
        // cellule article/dépôt ne peuvent pas écraser silencieusement la quantité.
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtextextended(${`${tenantId}:${selectedDepotId}:${line.articleId}`}, 0)
          )
        `;

        const current = await tx.stock.findUnique({
          where: {
            articleId_depotId: {
              articleId: line.articleId,
              depotId: selectedDepotId,
            },
          },
          select: { id: true, quantite: true },
        });

        const ancienneQuantite = current?.quantite ?? 0;
        const difference = line.quantiteComptee - ancienneQuantite;
        const article = articleById.get(line.articleId)!;

        if (current) {
          await tx.stock.update({
            where: { id: current.id },
            data: { quantite: line.quantiteComptee },
          });
        } else {
          await tx.stock.create({
            data: {
              articleId: line.articleId,
              depotId: selectedDepotId,
              quantite: line.quantiteComptee,
            },
          });
        }

        if (difference !== 0) {
          await tx.mouvementStock.create({
            data: {
              type: 'AJUSTEMENT_INVENTAIRE',
              quantite: Math.abs(difference),
              motif: `${reference} — ${reason}`,
              articleId: line.articleId,
              depotId: selectedDepotId,
              tenantId,
            },
          });
        }

        changes.push({
          articleId: line.articleId,
          designation: article.designation,
          ancienneQuantite,
          quantiteComptee: line.quantiteComptee,
          difference,
        });
      }

      return changes;
    });

    // L’audit ne doit pas rendre l’opération de stock indisponible : la transaction
    // métier est déjà validée. Une panne du mécanisme d’audit est donc non bloquante.
    try {
      await this.auditService.logEvent({
        tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'INVENTAIRE_REALISE',
        targetType: 'STOCK',
        targetId: selectedDepotId,
        reference,
        description: `Inventaire réalisé dans le dépôt ${depot.nom} : ${result.length} article(s).`,
        metadata: {
          depotId: selectedDepotId,
          motif: reason,
          changements: result.filter((line) => line.difference !== 0),
          lignes: result.length,
        },
      });
    } catch {
      // Ne pas annuler un inventaire déjà validé à cause d'un incident d'audit.
    }

    return {
      success: true,
      reference,
      depotId: selectedDepotId,
      lignes: result.length,
      lignesModifiees: result.filter((line) => line.difference !== 0).length,
      totalEcart: result.reduce((sum, line) => sum + line.difference, 0),
      changements: result,
    };
  }
}
