import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActor } from '../../audit/audit-actor.util';
import { SecureDepotBoissonsVenteService } from './secure-vente.service';
import {
  getIdempotencyKey,
  stockOperationId,
} from './stock-idempotency';

@Injectable()
export class ProductionDepotStockService extends SecureDepotBoissonsVenteService {
  private readonly db: PrismaService;
  private readonly audit: AuditService;

  constructor(prisma: PrismaService, auditService: AuditService) {
    super(prisma, auditService);
    this.db = prisma;
    this.audit = auditService;
  }

  private async assertArticleAndDepot(tenantId: string, articleId: string, depotId: string) {
    const [article, depot] = await Promise.all([
      this.db.article.findFirst({
        where: { id: articleId, tenantId },
        select: { id: true },
      }),
      this.db.depot.findFirst({
        where: { id: depotId, tenantId, isArchived: false },
        select: { id: true },
      }),
    ]);
    if (!article) throw new NotFoundException('Article introuvable ou non autorisé.');
    if (!depot) throw new NotFoundException('Dépôt introuvable ou non autorisé.');
  }

  private async assertTransferScope(
    tenantId: string,
    articleId: string,
    sourceDepotId: string,
    destDepotId: string,
  ) {
    const [article, sourceDepot, destinationDepot] = await Promise.all([
      this.db.article.findFirst({ where: { id: articleId, tenantId }, select: { id: true } }),
      this.db.depot.findFirst({
        where: { id: sourceDepotId, tenantId, isArchived: false },
        select: { id: true },
      }),
      this.db.depot.findFirst({
        where: { id: destDepotId, tenantId, isArchived: false },
        select: { id: true },
      }),
    ]);
    if (!article) throw new NotFoundException('Article introuvable ou non autorisé.');
    if (!sourceDepot) throw new NotFoundException('Dépôt source introuvable ou non autorisé.');
    if (!destinationDepot) throw new NotFoundException('Dépôt destination introuvable ou non autorisé.');
  }

  private async withSerializableRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 3
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException('Conflit concurrent sur le stock, veuillez réessayer.');
  }

  private assertSameEntryOrThrow(
    existing: { tenantId: string; articleId: string; depotId: string; quantite: number; motif: string | null },
    expected: { tenantId: string; articleId: string; depotId: string; quantite: number; motif: string },
  ) {
    if (
      existing.tenantId !== expected.tenantId ||
      existing.articleId !== expected.articleId ||
      existing.depotId !== expected.depotId ||
      existing.quantite !== expected.quantite ||
      (existing.motif ?? '') !== expected.motif
    ) {
      throw new ConflictException('Cette clé d’idempotence a déjà été utilisée avec des données différentes.');
    }
  }

  private assertSameTransferOrThrow(
    existing: {
      tenantId: string;
      sourceDepotId: string;
      destDepotId: string;
      motif: string | null;
      lignes: Array<{ articleId: string; quantite: number }>;
    },
    expected: {
      tenantId: string;
      sourceDepotId: string;
      destDepotId: string;
      articleId: string;
      quantite: number;
      motif: string;
    },
  ) {
    const line = existing.lignes[0];
    if (
      existing.tenantId !== expected.tenantId ||
      existing.sourceDepotId !== expected.sourceDepotId ||
      existing.destDepotId !== expected.destDepotId ||
      (existing.motif ?? '') !== (expected.motif || '') ||
      existing.lignes.length !== 1 ||
      !line ||
      line.articleId !== expected.articleId ||
      line.quantite !== expected.quantite
    ) {
      throw new ConflictException('Cette clé d’idempotence a déjà été utilisée avec des données différentes.');
    }
  }

  override async entreStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const depotId = String(data?.depotId ?? '').trim();
    const quantite = Number(data?.quantite);
    if (!articleId || !depotId) throw new BadRequestException('articleId et depotId sont requis.');
    if (!Number.isSafeInteger(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité doit être un entier sûr supérieur à 0.');
    }
    await this.assertArticleAndDepot(tenantId, articleId, depotId);
    const motif = String(data?.motif ?? 'Entrée manuelle').trim() || 'Entrée manuelle';
    const idempotencyKey = getIdempotencyKey(data);
    const mouvementId = idempotencyKey
      ? stockOperationId(tenantId, idempotencyKey)
      : randomUUID();

    const mouvement = await this.withSerializableRetry(() =>
      this.db.$transaction(async (tx) => {
        if (idempotencyKey) {
          const existing = await tx.mouvementStock.findUnique({ where: { id: mouvementId } });
          if (existing) {
            this.assertSameEntryOrThrow(existing, { tenantId, articleId, depotId, quantite, motif });
            return existing;
          }
        }

        const created = await tx.mouvementStock.create({
          data: { id: mouvementId, type: 'ENTREE', quantite, articleId, depotId, tenantId, motif },
        });
        await tx.stock.upsert({
          where: { articleId_depotId: { articleId, depotId } },
          update: { quantite: { increment: quantite } },
          create: { articleId, depotId, quantite },
        });
        return created;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }),
    );

    await this.audit.logEvent({
      tenantId,
      depotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'ENTREE_STOCK',
      severite: 'INFO',
      targetType: 'MouvementStock',
      targetId: mouvement.id,
      description: `Entrée stock: ${quantite} unité(s) — ${motif}`,
      valeurApres: { quantite, articleId, depotId },
      motif,
      ipAddress: actor.ip,
      userAgent: actor.userAgent,
    }).catch((error) => {
      console.error('[Audit] Échec log ENTREE_STOCK:', error);
    });
    return mouvement;
  }

  override async sortieStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const depotId = String(data?.depotId ?? '').trim();
    const quantite = Number(data?.quantite);
    if (!articleId || !depotId) throw new BadRequestException('articleId et depotId sont requis.');
    if (!Number.isSafeInteger(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité doit être un entier sûr supérieur à 0.');
    }
    await this.assertArticleAndDepot(tenantId, articleId, depotId);
    const motif = String(data?.motif ?? 'Sortie manuelle').trim() || 'Sortie manuelle';
    const idempotencyKey = getIdempotencyKey(data);
    const mouvementId = idempotencyKey
      ? stockOperationId(tenantId, idempotencyKey)
      : randomUUID();

    const mouvement = await this.withSerializableRetry(() =>
      this.db.$transaction(async (tx) => {
        if (idempotencyKey) {
          const existing = await tx.mouvementStock.findUnique({ where: { id: mouvementId } });
          if (existing) {
            this.assertSameEntryOrThrow(existing, { tenantId, articleId, depotId, quantite, motif });
            return existing;
          }
        }

        const changed = await tx.stock.updateMany({
          where: { articleId, depotId, quantite: { gte: quantite } },
          data: { quantite: { decrement: quantite } },
        });
        if (changed.count !== 1) throw new BadRequestException('Stock insuffisant.');

        return tx.mouvementStock.create({
          data: { id: mouvementId, type: 'SORTIE', quantite, articleId, depotId, tenantId, motif },
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }),
    );

    await this.audit.logEvent({
      tenantId,
      depotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SORTIE_STOCK',
      severite: 'INFO',
      targetType: 'MouvementStock',
      targetId: mouvement.id,
      description: `Sortie stock: ${quantite} unité(s) — ${motif}`,
      valeurApres: { quantite, articleId, depotId },
      motif,
      ipAddress: actor.ip,
      userAgent: actor.userAgent,
    }).catch((error) => {
      console.error('[Audit] Échec log SORTIE_STOCK:', error);
    });
    return mouvement;
  }

  override async transfertStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const sourceDepotId = String(data?.sourceDepotId ?? data?.depotId ?? '').trim();
    const destDepotId = String(data?.depotDestination ?? '').trim();
    const quantite = Number(data?.quantite);
    if (!articleId || !sourceDepotId || !destDepotId) {
      throw new BadRequestException('articleId, sourceDepotId et depotDestination sont requis.');
    }
    if (sourceDepotId === destDepotId) {
      throw new BadRequestException('Les dépôts source et destination doivent être différents.');
    }
    if (!Number.isSafeInteger(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité doit être un entier sûr supérieur à 0.');
    }

    await this.assertTransferScope(tenantId, articleId, sourceDepotId, destDepotId);
    const motif = String(data?.motif ?? '').trim();
    const idempotencyKey = getIdempotencyKey(data);
    const reference = idempotencyKey
      ? `TRF-${stockOperationId(tenantId, idempotencyKey)}`
      : `TRF-${randomUUID()}`;

    let result: { transfert: any; destinationStock: number };
    try {
      result = await this.withSerializableRetry(() =>
        this.db.$transaction(async (tx) => {
          if (idempotencyKey) {
            const existing = await tx.transfertStock.findUnique({
              where: { reference },
              include: { lignes: { select: { articleId: true, quantite: true } } },
            });
            if (existing) {
              this.assertSameTransferOrThrow(existing, {
                tenantId,
                sourceDepotId,
                destDepotId,
                articleId,
                quantite,
                motif,
              });
              const currentDestination = await tx.stock.findUnique({
                where: { articleId_depotId: { articleId, depotId: destDepotId } },
                select: { quantite: true },
              });
              return { transfert: existing, destinationStock: currentDestination?.quantite ?? 0 };
            }
          }

          const changed = await tx.stock.updateMany({
            where: { articleId, depotId: sourceDepotId, quantite: { gte: quantite } },
            data: { quantite: { decrement: quantite } },
          });
          if (changed.count !== 1) throw new BadRequestException('Stock insuffisant dans le dépôt source.');

          const destination = await tx.stock.upsert({
            where: { articleId_depotId: { articleId, depotId: destDepotId } },
            update: { quantite: { increment: quantite } },
            create: { articleId, depotId: destDepotId, quantite },
          });
          const transfert = await tx.transfertStock.create({
            data: {
              reference,
              statut: 'TERMINE',
              sourceDepotId,
              destDepotId,
              motif: motif || null,
              tenantId,
              lignes: { create: { articleId, quantite } },
            },
            include: { lignes: { select: { articleId: true, quantite: true } } },
          });
          await tx.mouvementStock.createMany({
            data: [
              {
                type: 'TRANSFERT_SORTIE', quantite, articleId, depotId: sourceDepotId,
                tenantId, motif: motif || `Transfert ${reference} vers ${destDepotId}`,
              },
              {
                type: 'TRANSFERT_ENTREE', quantite, articleId, depotId: destDepotId,
                tenantId, motif: motif || `Transfert ${reference} depuis ${sourceDepotId}`,
              },
            ],
          });
          return { transfert, destinationStock: destination.quantite };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }),
      );
    } catch (error) {
      if (
        idempotencyKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.db.transfertStock.findUnique({
          where: { reference },
          include: { lignes: { select: { articleId: true, quantite: true } } },
        });
        if (existing) {
          this.assertSameTransferOrThrow(existing, {
            tenantId,
            sourceDepotId,
            destDepotId,
            articleId,
            quantite,
            motif,
          });
          result = { transfert: existing, destinationStock: 0 };
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    await this.audit.logEvent({
      tenantId,
      depotId: sourceDepotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'TRANSFERT_CREE',
      severite: 'INFO',
      targetType: 'TransfertStock',
      targetId: result.transfert.id,
      reference: result.transfert.reference,
      description: `Transfert ${result.transfert.reference}: ${quantite} unité(s) ${sourceDepotId} → ${destDepotId}`,
      valeurApres: { articleId, quantite, sourceDepotId, destDepotId, destinationStock: result.destinationStock },
      motif: motif || undefined,
      ipAddress: actor.ip,
      userAgent: actor.userAgent,
    }).catch((error) => {
      console.error('[Audit] Échec log TRANSFERT_CREE:', error);
    });
    return result.transfert;
  }
}
