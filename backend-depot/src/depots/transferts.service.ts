import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleUser, StatutTransfert, TypeMouvement } from '@prisma/client';
import { CreateTransfertDto } from './dto/create-transfert.dto';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';

@Injectable()
export class TransfertsService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private isPatron(actor?: any): boolean {
    return actor?.role === 'PATRON' || actor?.role === RoleUser.PATRON;
  }

  /**
   * Crée un brouillon de transfert.
   */
  async createTransfert(dto: CreateTransfertDto, tenantId: string, actor?: any) {
    if (!this.isPatron(actor)) {
      if (!actor?.depotId || dto.sourceDepotId !== actor.depotId) {
        throw new ForbiddenException(
          'Un gérant ne peut initier un transfert que depuis son propre dépôt source.',
        );
      }
    }

    return this.prisma.transfertStock.create({
      data: {
        reference: dto.reference,
        statut: StatutTransfert.BROUILLON,
        motif: dto.motif,
        sourceDepotId: dto.sourceDepotId,
        destDepotId: dto.destDepotId,
        tenantId: tenantId,
        lignes: {
          create: dto.lignes.map((l) => ({
            articleId: l.articleId,
            quantite: l.quantite,
          })),
        },
      },
      include: {
        lignes: { include: { article: true } },
        sourceDepot: true,
        destDepot: true,
      },
    });
  }

  /**
   * Valide le transfert et impacte physiquement les stocks.
   */
  async validerTransfert(id: string, tenantId: string, actor: any) {
    if (!this.isPatron(actor)) {
      const existing = await this.prisma.transfertStock.findFirst({
        where: { id, tenantId },
        select: { sourceDepotId: true, destDepotId: true },
      });
      if (
        !existing ||
        !actor?.depotId ||
        (existing.sourceDepotId !== actor.depotId &&
          existing.destDepotId !== actor.depotId)
      ) {
        throw new ForbiddenException(
          'Vous n’êtes pas autorisé à valider un transfert ne concernant pas votre dépôt.',
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transfert = await tx.transfertStock.findFirst({
        where: { id, tenantId },
        include: { lignes: true },
      });

      if (!transfert || transfert.statut !== StatutTransfert.BROUILLON) {
        throw new BadRequestException('Transfert introuvable ou déjà validé.');
      }

      for (const ligne of transfert.lignes) {
        // 1. Sortie du dépôt source
        await tx.stock.upsert({
          where: {
            articleId_depotId: {
              articleId: ligne.articleId,
              depotId: transfert.sourceDepotId,
            },
          },
          update: { quantite: { decrement: ligne.quantite } },
          create: {
            articleId: ligne.articleId,
            depotId: transfert.sourceDepotId,
            quantite: -ligne.quantite,
          },
        });

        await tx.mouvementStock.create({
          data: {
            type: TypeMouvement.TRANSFERT_SORTIE,
            quantite: ligne.quantite,
            articleId: ligne.articleId,
            depotId: transfert.sourceDepotId,
            tenantId,
            motif: `Transfert ${transfert.reference} vers ${transfert.destDepotId}`,
          },
        });

        // 2. Entrée dans le dépôt destination
        await tx.stock.upsert({
          where: {
            articleId_depotId: {
              articleId: ligne.articleId,
              depotId: transfert.destDepotId,
            },
          },
          update: { quantite: { increment: ligne.quantite } },
          create: {
            articleId: ligne.articleId,
            depotId: transfert.destDepotId,
            quantite: ligne.quantite,
          },
        });

        await tx.mouvementStock.create({
          data: {
            type: TypeMouvement.TRANSFERT_ENTREE,
            quantite: ligne.quantite,
            articleId: ligne.articleId,
            depotId: transfert.destDepotId,
            tenantId,
            motif: `Réception Transfert ${transfert.reference} de ${transfert.sourceDepotId}`,
          },
        });
      }

      return tx.transfertStock.update({
        where: { id },
        data: { statut: StatutTransfert.TERMINE },
      });
    });

    await this.auditService.logEvent({
      tenantId,
      depotId: result.sourceDepotId,
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      action: AUDIT_ACTIONS.TRANSFERT_VALIDE,
      targetType: 'TransfertStock',
      targetId: result.id,
      reference: result.reference,
      description: `Transfert ${result.reference} validé (${result.sourceDepotId} → ${result.destDepotId})`,
      valeurApres: result,
    });

    return result;
  }

  async findAll(tenantId: string, actor?: any) {
    const where: any = { tenantId };
    if (!this.isPatron(actor)) {
      if (!actor?.depotId) {
        return [];
      }
      where.OR = [
        { sourceDepotId: actor.depotId },
        { destDepotId: actor.depotId },
      ];
    }

    return this.prisma.transfertStock.findMany({
      where,
      include: { sourceDepot: true, destDepot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string, actor?: any) {
    const transfert = await this.prisma.transfertStock.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: true } },
        sourceDepot: true,
        destDepot: true,
      },
    });

    if (!transfert) return null;

    if (!this.isPatron(actor)) {
      if (
        !actor?.depotId ||
        (transfert.sourceDepotId !== actor.depotId &&
          transfert.destDepotId !== actor.depotId)
      ) {
        throw new ForbiddenException('Accès refusé à ce transfert.');
      }
    }

    return transfert;
  }
}
