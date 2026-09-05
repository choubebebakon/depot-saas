import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TypeMouvement } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { DepotScopeService } from '../common/depot-scope.service';

interface TransferActor {
  userId: string;
  email: string;
  role: string;
}

interface TransferInput {
  articleId: string;
  sourceDepotId: string;
  destDepotId: string;
  quantite: number;
  tenantId: string;
  motif?: string;
  actor: TransferActor;
}

@Injectable()
export class TransferStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly depotScope: DepotScopeService,
  ) {}

  async transfererStock(data: TransferInput) {
    this.validatePositiveQuantity(data.quantite);

    const scopedTenantId = this.depotScope.requireTenantId();
    if (scopedTenantId !== data.tenantId) {
      throw new ForbiddenException('Accès refusé au tenant demandé.');
    }

    if (data.sourceDepotId === data.destDepotId) {
      throw new BadRequestException(
        'Le dépôt source et le dépôt destination doivent être différents.',
      );
    }

    const scope = this.depotScope.getScope();
    if (scope.role !== 'PATRON') {
      const scopedDepotId = this.depotScope.requireDepotId();
      if (scopedDepotId !== data.sourceDepotId) {
        throw new ForbiddenException('Accès refusé au dépôt source.');
      }
      throw new ForbiddenException(
        'Seul le patron peut transférer entre dépôts.',
      );
    }

    if (!data.actor?.userId || !data.actor?.email || !data.actor?.role) {
      throw new ForbiddenException('Acteur authentifié requis.');
    }

    try {
      let auditAfterCommit: any = null;

      const result = await this.prisma.$transaction(
        async (tx) => {
          const depots = await tx.depot.findMany({
            where: {
              tenantId: data.tenantId,
              id: { in: [data.sourceDepotId, data.destDepotId] },
              isArchived: false,
            },
            select: { id: true },
          });

          if (depots.length !== 2) {
            throw new ForbiddenException(
              'Les dépôts source et destination doivent appartenir au tenant et être actifs.',
            );
          }

          const article = await tx.article.findFirst({
            where: { id: data.articleId, tenantId: data.tenantId },
            select: { id: true, designation: true },
          });

          if (!article) {
            throw new NotFoundException(
              'Article introuvable dans ce tenant.',
            );
          }

          const source = await tx.stock.updateMany({
            where: {
              articleId: data.articleId,
              depotId: data.sourceDepotId,
              quantite: { gte: data.quantite },
            },
            data: { quantite: { decrement: data.quantite } },
          });

          if (source.count !== 1) {
            throw new BadRequestException(
              'Stock source insuffisant ou introuvable.',
            );
          }

          const destination = await tx.stock.upsert({
            where: {
              articleId_depotId: {
                articleId: data.articleId,
                depotId: data.destDepotId,
              },
            },
            update: { quantite: { increment: data.quantite } },
            create: {
              articleId: data.articleId,
              depotId: data.destDepotId,
              quantite: data.quantite,
            },
          });

          await tx.mouvementStock.createMany({
            data: [
              {
                type: TypeMouvement.TRANSFERT_SORTIE,
                quantite: data.quantite,
                motif:
                  data.motif || `Vers Dépôt ${data.destDepotId}`,
                articleId: data.articleId,
                depotId: data.sourceDepotId,
                tenantId: data.tenantId,
              },
              {
                type: TypeMouvement.TRANSFERT_ENTREE,
                quantite: data.quantite,
                motif:
                  data.motif || `Depuis Dépôt ${data.sourceDepotId}`,
                articleId: data.articleId,
                depotId: data.destDepotId,
                tenantId: data.tenantId,
              },
            ],
          });

          auditAfterCommit = await this.auditService.logEventInTransaction(
            tx,
            {
              tenantId: data.tenantId,
              depotId: data.sourceDepotId,
              actorUserId: data.actor.userId,
              actorEmail: data.actor.email,
              actorRole: data.actor.role,
              action: 'TRANSFERT_STOCK',
              targetType: 'STOCK',
              targetId: destination.id,
              reference: article.designation || data.articleId,
              description: `Transfert de ${data.quantite} unité(s) du dépôt ${data.sourceDepotId} vers ${data.destDepotId}.`,
              metadata: {
                articleId: data.articleId,
                sourceDepotId: data.sourceDepotId,
                destDepotId: data.destDepotId,
                quantite: data.quantite,
                motif: data.motif || null,
              },
            },
          );

          return {
            success: true,
            quantite: data.quantite,
            sourceDepotId: data.sourceDepotId,
            destDepotId: data.destDepotId,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      if (auditAfterCommit) {
        this.auditService.emitAuditUpdate(data.tenantId, auditAfterCommit);
      }

      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Le transfert a rencontré une modification simultanée. Réessayez.',
        );
      }
      throw error;
    }
  }

  private validatePositiveQuantity(value: number): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(
        'quantite doit être un entier strictement positif.',
      );
    }
  }
}
