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

  override async entreStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const depotId = String(data?.depotId ?? '').trim();
    const quantite = Number(data?.quantite);
    if (!articleId || !depotId) throw new BadRequestException('articleId et depotId sont requis.');
    if (!Number.isInteger(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité doit être un entier supérieur à 0.');
    }
    await this.assertArticleAndDepot(tenantId, articleId, depotId);
    const motif = String(data?.motif ?? 'Entrée manuelle').trim() || 'Entrée manuelle';

    const mouvement = await this.withSerializableRetry(() =>
      this.db.$transaction(async (tx) => {
        await tx.stock.upsert({
          where: { articleId_depotId: { articleId, depotId } },
          update: { quantite: { increment: quantite } },
          create: { articleId, depotId, quantite },
        });
        return tx.mouvementStock.create({
          data: { type: 'ENTREE', quantite, articleId, depotId, tenantId, motif },
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
    if (!Number.isInteger(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité doit être un entier supérieur à 0.');
    }
    await this.assertArticleAndDepot(tenantId, articleId, depotId);
    const motif = String(data?.motif ?? 'Sortie manuelle').trim() || 'Sortie manuelle';

    const mouvement = await this.withSerializableRetry(() =>
      this.db.$transaction(async (tx) => {
        const changed = await tx.stock.updateMany({
          where: { articleId, depotId, quantite: { gte: quantite } },
          data: { quantite: { decrement: quantite } },
        });
        if (changed.count !== 1) throw new BadRequestException('Stock insuffisant.');
        return tx.mouvementStock.create({
          data: { type: 'SORTIE', quantite, articleId, depotId, tenantId, motif },
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
    if (!Number.isInteger(quantite) || quantite <= 0) {
      throw new BadRequestException('La quantité doit être un entier supérieur à 0.');
    }

    const [article, sourceDepot, destinationDepot] = await Promise.all([
      this.db.article.findFirst({ where: { id: articleId, tenantId }, select: { id: true } }),
      this.db.depot.findFirst({ where: { id: sourceDepotId, tenantId, isArchived: false }, select: { id: true } }),
      this.db.depot.findFirst({ where: { id: destDepotId, tenantId, isArchived: false }, select: { id: true } }),
    ]);
    if (!article) throw new NotFoundException('Article introuvable ou non autorisé.');
    if (!sourceDepot) throw new NotFoundException('Dépôt source introuvable ou non autorisé.');
    if (!destinationDepot) throw new NotFoundException('Dépôt destination introuvable ou non autorisé.');

    const motif = String(data?.motif ?? '').trim();
    const result = await this.withSerializableRetry(() =>
      this.db.$transaction(async (tx) => {
        const reference = `TRF-${randomUUID()}`;
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