import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditSeverite, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActor } from '../../audit/audit-actor.util';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { SupermarchePosService } from './supermarche-pos.service';

@Injectable()
export class ProductionSupermarcheStockService extends SupermarchePosService {
  private readonly db: PrismaService;
  private readonly audit: AuditService;

  constructor(prisma: PrismaService, auditService: AuditService) {
    super(prisma, auditService);
    this.db = prisma;
    this.audit = auditService;
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
        ) continue;
        throw error;
      }
    }
    throw new ConflictException('Conflit concurrent sur le stock, veuillez réessayer.');
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
      this.db.$transaction(async (tx) => {
        const article = await tx.article.findFirst({
          where: { id, tenantId },
          select: { id: true, designation: true },
        });
        if (!article) throw new NotFoundException('Article non trouvé.');

        const stock = await tx.stock.findFirst({
          where: {
            articleId: id,
            depotId: actor.depotId,
            depot: { tenantId, isArchived: false },
          },
        });
        if (!stock) throw new NotFoundException('Stock introuvable dans le dépôt actif.');

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
              depotId: actor.depotId,
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
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }),
    );

    await this.audit.logEvent({
      tenantId,
      depotId: actor.depotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.AJUSTEMENT_STOCK,
      severite: result.difference === 0 ? AuditSeverite.INFO : AuditSeverite.ATTENTION,
      targetType: 'Stock',
      targetId: id,
      reference: result.article.designation,
      description: `Ajustement de stock "${result.article.designation}" : ${result.quantiteAvant} → ${result.quantiteApres}`,
      valeurAvant: { quantite: result.quantiteAvant },
      valeurApres: { quantite: result.quantiteApres, difference: result.difference },
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
      this.db.$transaction(async (tx) => {
        const vente = await tx.vente.findFirst({
          where: { id, tenantId },
          include: { lignes: true },
        });
        if (!vente) throw new NotFoundException('Vente non trouvée.');
        if (vente.statut === 'ANNULE') throw new BadRequestException('Cette vente est déjà annulée.');

        await tx.vente.update({
          where: { id },
          data: { statut: 'ANNULE', motifAnnulation: motifFinal },
        });

        for (const ligne of vente.lignes) {
          await tx.stock.upsert({
            where: { articleId_depotId: { articleId: ligne.articleId, depotId: vente.depotId } },
            update: { quantite: { increment: ligne.quantite } },
            create: { articleId: ligne.articleId, depotId: vente.depotId, quantite: ligne.quantite },
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
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }),
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
}
