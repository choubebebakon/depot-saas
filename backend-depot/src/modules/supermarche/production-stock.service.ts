import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditSeverite, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActor } from '../../audit/audit-actor.util';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { DepotScopeService } from '../../common/depot-scope.service';
import { SupermarchePosService } from './supermarche-pos.service';

@Injectable()
export class ProductionSupermarcheStockService extends SupermarchePosService {
  protected readonly audit: AuditService;

  constructor(
    prisma: PrismaService,
    auditService: AuditService,
    depotScope: DepotScopeService,
  ) {
    super(prisma, auditService, depotScope);
    this.audit = auditService;
  }

  private async withSerializableRetry<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 3
        )
          continue;
        throw error;
      }
    }
    throw new ConflictException(
      'Conflit concurrent sur le stock, veuillez réessayer.',
    );
  }

  override async partialUpdateArticleStock(
    id: string,
    tenantId: string,
    data: { stock: number },
    actor: AuditActor,
  ) {
    const nouvelleQuantite = Number(data?.stock);
    if (!Number.isInteger(nouvelleQuantite) || nouvelleQuantite < 0) {
      throw new BadRequestException('Quantité de stock invalide.');
    }
    if (!actor.depotId) {
      throw new BadRequestException('Aucun dépôt actif pour cet ajustement.');
    }

    const result = await this.withSerializableRetry(() =>
      this.db.$transaction(
        async (tx) => {
          const article = await tx.article.findFirst({
            where: { id, tenantId },
            select: { id: true, designation: true },
          });
          if (!article) throw new NotFoundException('Article non trouvé.');

          const stock = await tx.stock.findFirst({
            where: {
              articleId: id,
              depotId: actor.depotId!,
              depot: { tenantId, isArchived: false },
            },
          });
          if (!stock)
            throw new NotFoundException(
              'Stock introuvable dans le dépôt actif.',
            );

          const difference = nouvelleQuantite - stock.quantite;
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantite: nouvelleQuantite },
          });

          if (difference !== 0) {
            await tx.mouvementStock.create({
              data: {
                tenantId,
                articleId: id,
                depotId: actor.depotId!,
                type: 'AJUSTEMENT_INVENTAIRE',
                quantite: Math.abs(difference),
                motif: `Ajustement manuel (${difference >= 0 ? '+' : ''}${difference})`,
              },
            });
          }

          return {
            article,
            quantiteAvant: stock.quantite,
            quantiteApres: nouvelleQuantite,
            difference,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      ),
    );

    await this.audit.logEvent({
      tenantId,
      depotId: actor.depotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.AJUSTEMENT_STOCK,
      severite:
        result.difference === 0 ? AuditSeverite.INFO : AuditSeverite.ATTENTION,
      targetType: 'Stock',
      targetId: id,
      reference: result.article.designation,
      description: `Ajustement de stock "${result.article.designation}" : ${result.quantiteAvant} → ${result.quantiteApres}`,
      valeurAvant: { quantite: result.quantiteAvant },
      valeurApres: {
        quantite: result.quantiteApres,
        difference: result.difference,
      },
      motif: 'Ajustement manuel',
      ipAddress: actor.ip,
      userAgent: actor.userAgent,
    });

    return { success: true, quantite: result.quantiteApres };
  }

  override async annulerVente(
    id: string,
    tenantId: string,
    motif: string | undefined,
    actor: AuditActor,
  ) {
    const motifFinal = motif?.trim() || 'Annulation manuelle';
    const result = await this.withSerializableRetry(() =>
      this.db.$transaction(
        async (tx) => {
          const vente = await tx.vente.findFirst({
            where: { id, tenantId },
            include: { lignes: true },
          });
          if (!vente) throw new NotFoundException('Vente non trouvée.');
          if (vente.statut === 'ANNULE')
            throw new BadRequestException('Cette vente est déjà annulée.');

          await tx.vente.update({
            where: { id },
            data: { statut: 'ANNULE', motifAnnulation: motifFinal },
          });

          for (const ligne of vente.lignes) {
            await tx.stock.upsert({
              where: {
                articleId_depotId: {
                  articleId: ligne.articleId,
                  depotId: vente.depotId,
                },
              },
              update: { quantite: { increment: ligne.quantite } },
              create: {
                articleId: ligne.articleId,
                depotId: vente.depotId,
                quantite: ligne.quantite,
              },
            });
            await tx.mouvementStock.create({
              data: {
                tenantId,
                articleId: ligne.articleId,
                depotId: vente.depotId,
                type: 'ENTREE',
                quantite: ligne.quantite,
                motif: `Annulation vente ${vente.reference}`,
              },
            });
          }

          return vente;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      ),
    );

    await this.audit.logEvent({
      tenantId,
      depotId: result.depotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.VENTE_ANNULEE,
      severite: AuditSeverite.CRITIQUE,
      targetType: 'Vente',
      targetId: result.id,
      reference: result.reference,
      description: `Vente ${result.reference} annulée — ${motifFinal}`,
      valeurAvant: { statut: result.statut, total: result.total },
      valeurApres: { statut: 'ANNULE', motif: motifFinal },
      motif: motifFinal,
      montant: -result.total,
      ipAddress: actor.ip,
      userAgent: actor.userAgent,
    });

    return { success: true };
  }

  override async entreeStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const depotId = String(data?.depotId ?? '').trim();
    const quantite = Number(data?.quantite);
    if (!articleId) throw new BadRequestException('articleId est requis.');
    if (!depotId) throw new BadRequestException('depotId est requis.');
    if (!Number.isInteger(quantite) || quantite < 1) {
      throw new BadRequestException('Quantité d\'entrée invalide.');
    }

    const result = await this.withSerializableRetry(() =>
      this.db.$transaction(
        async (tx) => {
          const article = await tx.article.findFirst({
            where: { id: articleId, tenantId },
            select: { id: true, designation: true },
          });
          if (!article) throw new NotFoundException('Article non trouvé.');
          const depot = await tx.depot.findFirst({
            where: { id: depotId, tenantId, isArchived: false },
            select: { id: true },
          });
          if (!depot)
            throw new NotFoundException('Dépôt introuvable ou non autorisé.');

          const stock = await tx.stock.upsert({
            where: { articleId_depotId: { articleId, depotId } },
            update: { quantite: { increment: quantite } },
            create: { articleId, depotId, quantite },
          });

          await tx.mouvementStock.create({
            data: {
              type: 'ENTREE',
              quantite,
              articleId,
              depotId,
              tenantId,
              motif: data.motif ? String(data.motif) : 'Entrée de stock',
            },
          });

          return { stock, article };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      ),
    );

    await this.audit
      .logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.ENTREE_STOCK,
        severite: AuditSeverite.INFO,
        targetType: 'Stock',
        targetId: articleId,
        reference: result.article.designation,
        description: `Entrée de stock "${result.article.designation}" : +${quantite} (total ${result.stock.quantite})`,
        valeurApres: { articleId, depotId, quantite, total: result.stock.quantite },
        motif: data.motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((error) => console.error('[Audit] Échec log ENTREE_STOCK:', error));

    return { success: true, quantite: result.stock.quantite, articleId, depotId };
  }

  override async sortieStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const depotId = String(data?.depotId ?? '').trim();
    const quantite = Number(data?.quantite);
    if (!articleId) throw new BadRequestException('articleId est requis.');
    if (!depotId) throw new BadRequestException('depotId est requis.');
    if (!Number.isInteger(quantite) || quantite < 1) {
      throw new BadRequestException('Quantité de sortie invalide.');
    }

    const result = await this.withSerializableRetry(() =>
      this.db.$transaction(
        async (tx) => {
          const article = await tx.article.findFirst({
            where: { id: articleId, tenantId },
            select: { id: true, designation: true },
          });
          if (!article) throw new NotFoundException('Article non trouvé.');
          const depot = await tx.depot.findFirst({
            where: { id: depotId, tenantId, isArchived: false },
            select: { id: true },
          });
          if (!depot)
            throw new NotFoundException('Dépôt introuvable ou non autorisé.');

          const decremented = await tx.stock.updateMany({
            where: { articleId, depotId, quantite: { gte: quantite } },
            data: { quantite: { decrement: quantite } },
          });
          if (decremented.count === 0) {
            const current = await tx.stock.findFirst({
              where: { articleId, depotId },
              select: { quantite: true },
            });
            throw new BadRequestException(
              `Stock insuffisant. Disponible : ${current?.quantite ?? 0}.`,
            );
          }

          await tx.mouvementStock.create({
            data: {
              type: 'SORTIE',
              quantite,
              articleId,
              depotId,
              tenantId,
              motif: data.motif ? String(data.motif) : 'Sortie de stock',
            },
          });

          const stock = await tx.stock.findUnique({
            where: { articleId_depotId: { articleId, depotId } },
            select: { quantite: true },
          });

          return { stock, article };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      ),
    );

    await this.audit
      .logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SORTIE_STOCK,
        severite: AuditSeverite.INFO,
        targetType: 'Stock',
        targetId: articleId,
        reference: result.article.designation,
        description: `Sortie de stock "${result.article.designation}" : -${quantite} (total ${result.stock?.quantite ?? 0})`,
        valeurApres: { articleId, depotId, quantite, total: result.stock?.quantite ?? 0 },
        motif: data.motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((error) => console.error('[Audit] Échec log SORTIE_STOCK:', error));

    return { success: true, quantite: result.stock?.quantite ?? 0, articleId, depotId };
  }

  override async transfertStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = String(data?.articleId ?? '').trim();
    const sourceDepotId = String(data?.sourceDepotId ?? '').trim();
    const destDepotId = String(data?.destDepotId ?? '').trim();
    const quantite = Number(data?.quantite);
    const motif = data?.motif ? String(data.motif) : undefined;
    if (!articleId) throw new BadRequestException('articleId est requis.');
    if (!sourceDepotId) throw new BadRequestException('sourceDepotId est requis.');
    if (!destDepotId) throw new BadRequestException('destDepotId est requis.');
    if (sourceDepotId === destDepotId)
      throw new BadRequestException('Les dépôts source et destination doivent être différents.');
    if (!Number.isInteger(quantite) || quantite < 1) {
      throw new BadRequestException('Quantité de transfert invalide.');
    }

    const result = await this.withSerializableRetry(() =>
      this.db.$transaction(
        async (tx) => {
          const article = await tx.article.findFirst({
            where: { id: articleId, tenantId },
            select: { id: true, designation: true },
          });
          if (!article) throw new NotFoundException('Article non trouvé.');
          const [source, destination] = await Promise.all([
            tx.depot.findFirst({
              where: { id: sourceDepotId, tenantId, isArchived: false },
              select: { id: true, nom: true },
            }),
            tx.depot.findFirst({
              where: { id: destDepotId, tenantId, isArchived: false },
              select: { id: true, nom: true },
            }),
          ]);
          if (!source) throw new NotFoundException('Dépôt source introuvable.');
          if (!destination)
            throw new NotFoundException('Dépôt destination introuvable.');

          const decremented = await tx.stock.updateMany({
            where: { articleId, depotId: sourceDepotId, quantite: { gte: quantite } },
            data: { quantite: { decrement: quantite } },
          });
          if (decremented.count === 0) {
            const current = await tx.stock.findFirst({
              where: { articleId, depotId: sourceDepotId },
              select: { quantite: true },
            });
            throw new BadRequestException(
              `Stock insuffisant dans le dépôt source. Disponible : ${current?.quantite ?? 0}.`,
            );
          }

          const destinationStock = await tx.stock.upsert({
            where: { articleId_depotId: { articleId, depotId: destDepotId } },
            update: { quantite: { increment: quantite } },
            create: { articleId, depotId: destDepotId, quantite },
          });

          const reference = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const transfert = await tx.transfertStock.create({
            data: {
              reference,
              statut: 'TERMINE',
              sourceDepotId,
              destDepotId,
              motif,
              tenantId,
              lignes: { create: { articleId, quantite } },
            },
            include: { lignes: { select: { articleId: true, quantite: true } } },
          });

          await tx.mouvementStock.createMany({
            data: [
              {
                type: 'TRANSFERT_SORTIE',
                quantite,
                articleId,
                depotId: sourceDepotId,
                tenantId,
                motif: motif || `Transfert ${reference} vers ${destination.nom}`,
              },
              {
                type: 'TRANSFERT_ENTREE',
                quantite,
                articleId,
                depotId: destDepotId,
                tenantId,
                motif: motif || `Transfert ${reference} depuis ${source.nom}`,
              },
            ],
          });

          return { transfert, destinationStock, article };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      ),
    );

    await this.audit
      .logEvent({
        tenantId,
        depotId: sourceDepotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.TRANSFERT_CREE,
        severite: AuditSeverite.INFO,
        targetType: 'TransfertStock',
        targetId: result.transfert.id,
        reference: result.transfert.reference,
        description: `Transfert ${result.transfert.reference}: ${quantite} unité(s) ${sourceDepotId} → ${destDepotId}`,
        valeurApres: {
          articleId,
          quantite,
          sourceDepotId,
          destDepotId,
          destinationStock: result.destinationStock.quantite,
        },
        motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((error) => console.error('[Audit] Échec log TRANSFERT_CREE:', error));

    return result.transfert;
  }
}
