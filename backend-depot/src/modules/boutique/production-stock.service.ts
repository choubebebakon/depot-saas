import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditSeverite, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActor } from '../../audit/audit-actor.util';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { VentesService } from './boutique.service';

@Injectable()
export class ProductionBoutiqueVentesService extends VentesService {
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

  override async createVente(tenantId: string, data: any, actor: AuditActor) {
    const depotId = String(data?.depotId ?? '').trim();
    if (!depotId) throw new BadRequestException('depotId est requis.');
    const depot = await this.db.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true },
    });
    if (!depot) throw new NotFoundException('Dépôt introuvable ou non autorisé.');

    if (!Array.isArray(data?.panier) || data.panier.length === 0) {
      throw new BadRequestException('Le panier est vide ou invalide.');
    }
    const articleIds = [...new Set(data.panier.map((item: any) => item.articleId))];
    const articles = await this.db.article.findMany({
      where: { tenantId, id: { in: articleIds } },
      select: { id: true },
    });
    if (articles.length !== articleIds.length) {
      throw new NotFoundException('Un ou plusieurs articles ne sont pas autorisés pour ce tenant.');
    }

    return super.createVente(tenantId, data, actor);
  }

  override async annulerVente(
    id: string,
    tenantId: string,
    motif: string | undefined,
    actor: AuditActor,
  ) {
    const motifFinal = motif?.trim() || 'Annulation manuelle';
    const vente = await this.withSerializableRetry(() =>
      this.db.$transaction(async (tx) => {
        const row = await tx.vente.findFirst({
          where: { id, tenantId },
          include: { lignes: true },
        });
        if (!row) throw new NotFoundException('Vente non trouvée.');
        if (row.statut === 'ANNULE') throw new BadRequestException('Cette vente est déjà annulée.');

        const updated = await tx.vente.updateMany({
          where: { id, tenantId, statut: { not: 'ANNULE' } },
          data: { statut: 'ANNULE', motifAnnulation: motifFinal },
        });
        if (updated.count !== 1) throw new ConflictException('La vente a été modifiée entre-temps.');

        for (const ligne of row.lignes) {
          await tx.stock.upsert({
            where: { articleId_depotId: { articleId: ligne.articleId, depotId: row.depotId } },
            update: { quantite: { increment: ligne.quantite } },
            create: { articleId: ligne.articleId, depotId: row.depotId, quantite: ligne.quantite },
          });
          await tx.mouvementStock.create({
            data: {
              tenantId,
              articleId: ligne.articleId,
              depotId: row.depotId,
              type: 'ENTREE',
              quantite: ligne.quantite,
              motif: `Annulation vente ${row.reference}`,
            },
          });
        }
        return row;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }),
    );

    await this.audit.logEvent({
      tenantId,
      depotId: vente.depotId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.VENTE_ANNULEE,
      severite: AuditSeverite.CRITIQUE,
      targetType: 'Vente',
      targetId: vente.id,
      reference: vente.reference,
      description: `Vente ${vente.reference} annulée — ${motifFinal}`,
      valeurAvant: { statut: vente.statut, total: vente.total },
      valeurApres: { statut: 'ANNULE', motif: motifFinal },
      motif: motifFinal,
      montant: -vente.total,
      ipAddress: actor.ip,
      userAgent: actor.userAgent,
    });

    return { success: true };
  }
}
