import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatutTransfert, TypeMouvement } from '@prisma/client';
import { CreateTransfertDto } from './dto/create-transfert.dto';

@Injectable()
export class TransfertsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Crée un brouillon de transfert.
   */
  async createTransfert(dto: CreateTransfertDto, tenantId: string) {
    return this.prisma.transfertStock.create({
      data: {
        reference: dto.reference,
        statut: StatutTransfert.BROUILLON,
        motif: dto.motif,
        sourceDepotId: dto.sourceDepotId,
        destDepotId: dto.destDepotId,
        tenantId: tenantId,
        lignes: {
          create: dto.lignes.map(l => ({
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
    return this.prisma.$transaction(async (tx) => {
      const transfert = await tx.transfertStock.findFirst({
        where: { id, tenantId },
        include: { lignes: true },
      });

      if (!transfert || transfert.statut !== StatutTransfert.BROUILLON) {
        throw new BadRequestException("Transfert introuvable ou déjà validé.");
      }

      for (const ligne of transfert.lignes) {
        // 1. Sortie du dépôt source
        await tx.stock.upsert({
          where: { articleId_depotId: { articleId: ligne.articleId, depotId: transfert.sourceDepotId } },
          update: { quantite: { decrement: ligne.quantite } },
          create: { articleId: ligne.articleId, depotId: transfert.sourceDepotId, quantite: -ligne.quantite },
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
          where: { articleId_depotId: { articleId: ligne.articleId, depotId: transfert.destDepotId } },
          update: { quantite: { increment: ligne.quantite } },
          create: { articleId: ligne.articleId, depotId: transfert.destDepotId, quantite: ligne.quantite },
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
  }

  async findAll(tenantId: string) {
    return this.prisma.transfertStock.findMany({
      where: { tenantId },
      include: { sourceDepot: true, destDepot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.transfertStock.findFirst({
      where: { id, tenantId },
      include: { 
        lignes: { include: { article: true } }, 
        sourceDepot: true, 
        destDepot: true 
      },
    });
  }
}
