import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { CreateReceptionDto } from './dto/create-reception.dto';

@Injectable()
export class FournisseursService {
  constructor(private readonly prisma: PrismaService) {}

  private requireScope(tenantId?: string, depotId?: string) {
    if (!tenantId) {
      throw new ForbiddenException('Contexte tenant introuvable.');
    }
    if (!depotId) {
      throw new BadRequestException('Un dépôt actif est obligatoire.');
    }
    return { tenantId, depotId };
  }

  private async assertDepotInTenant(tenantId: string, depotId: string, tx = this.prisma) {
    const depot = await tx.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true },
    });
    if (!depot) {
      throw new ForbiddenException('Dépôt invalide ou inaccessible.');
    }
    return depot.id;
  }

  async createFournisseur(dto: CreateFournisseurDto, tenantId: string, depotId: string) {
    const scope = this.requireScope(tenantId, depotId);
    const nom = dto.nom?.trim();
    if (!nom) {
      throw new BadRequestException('Le nom du fournisseur est obligatoire.');
    }

    await this.assertDepotInTenant(scope.tenantId, scope.depotId);

    const initialAmount = dto.soldeInitial === undefined ? 0 : Number(dto.soldeInitial);
    if (!Number.isFinite(initialAmount) || initialAmount < 0) {
      throw new BadRequestException('Le solde initial doit être un montant positif ou nul.');
    }

    return this.prisma.fournisseur.create({
      data: {
        nom,
        telephone: dto.telephone?.trim() || null,
        email: dto.email?.trim() || null,
        adresse: dto.adresse?.trim() || null,
        soldeInitial: initialAmount,
        solde: initialAmount,
        notes: dto.notes?.trim() || null,
        depotId: scope.depotId,
        tenantId: scope.tenantId,
      },
    });
  }

  async findAllFournisseurs(tenantId: string, depotId: string) {
    const scope = this.requireScope(tenantId, depotId);
    return this.prisma.fournisseur.findMany({
      where: { tenantId: scope.tenantId, depotId: scope.depotId },
      include: { depot: true },
      orderBy: { createdAt: 'desc' },
    }).then((fournisseurs) => fournisseurs.map((f) => ({
      ...f,
      depotName: f.depot?.nom || 'Aucun',
      solde: f.solde || 0,
    })));
  }

  async updateFournisseur(
    tenantId: string,
    depotId: string,
    id: string,
    dto: Partial<CreateFournisseurDto>,
  ) {
    const scope = this.requireScope(tenantId, depotId);
    await this.assertDepotInTenant(scope.tenantId, scope.depotId);

    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId: scope.tenantId, depotId: scope.depotId },
    });
    if (!fournisseur) throw new NotFoundException('Fournisseur introuvable dans ce dépôt.');

    let nextSoldeInitial = fournisseur.soldeInitial;
    if (dto.soldeInitial !== undefined) {
      nextSoldeInitial = Number(dto.soldeInitial);
      if (!Number.isFinite(nextSoldeInitial) || nextSoldeInitial < 0) {
        throw new BadRequestException('Le solde initial doit être un montant positif ou nul.');
      }
    }

    return this.prisma.fournisseur.update({
      where: { id },
      data: {
        nom: dto.nom?.trim() || fournisseur.nom,
        telephone: dto.telephone !== undefined ? dto.telephone?.trim() || null : fournisseur.telephone,
        email: dto.email !== undefined ? dto.email?.trim() || null : fournisseur.email,
        adresse: dto.adresse !== undefined ? dto.adresse?.trim() || null : fournisseur.adresse,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : fournisseur.notes,
        soldeInitial: nextSoldeInitial,
      },
    });
  }

  async deleteFournisseur(tenantId: string, depotId: string, id: string) {
    const scope = this.requireScope(tenantId, depotId);
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId: scope.tenantId, depotId: scope.depotId },
      include: { _count: { select: { receptions: true } } },
    });

    if (!fournisseur) throw new NotFoundException('Fournisseur introuvable dans ce dépôt.');
    if (fournisseur._count.receptions > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce fournisseur car des réceptions y sont rattachées.',
      );
    }

    return this.prisma.fournisseur.delete({ where: { id: fournisseur.id } });
  }

  async createReception(dto: CreateReceptionDto, tenantId: string, depotId: string) {
    const scope = this.requireScope(tenantId, depotId);

    return this.prisma.$transaction(async (tx) => {
      await this.assertDepotInTenant(scope.tenantId, scope.depotId, tx);

      if (!dto.lignes?.length) {
        throw new BadRequestException('Une réception doit contenir au moins une ligne.');
      }
      if (!dto.fournisseurId) {
        throw new BadRequestException('Le fournisseur est obligatoire.');
      }

      const fournisseur = await tx.fournisseur.findFirst({
        where: {
          id: dto.fournisseurId,
          tenantId: scope.tenantId,
          depotId: scope.depotId,
        },
        select: { id: true },
      });
      if (!fournisseur) {
        throw new ForbiddenException('Fournisseur inaccessible pour ce dépôt.');
      }

      const montantPaye = Number(dto.montantPaye ?? 0);
      if (!Number.isFinite(montantPaye) || montantPaye < 0) {
        throw new BadRequestException('Le montant payé est invalide.');
      }

      let totalReception = 0;
      const linesToCreate: Array<Record<string, unknown>> = [];
      const stockUpdates: Array<{ articleId: string; totalQte: number }> = [];

      for (const ligne of dto.lignes) {
        const quantiteLivree = Number(ligne.quantiteLivree);
        const quantiteGratuite = Number(ligne.quantiteGratuite ?? 0);
        const prixAchat = Number(ligne.prixAchatUnitaire);
        if (!Number.isFinite(quantiteLivree) || quantiteLivree <= 0) {
          throw new BadRequestException('La quantité livrée doit être strictement positive.');
        }
        if (!Number.isFinite(quantiteGratuite) || quantiteGratuite < 0) {
          throw new BadRequestException('La quantité gratuite est invalide.');
        }
        if (!Number.isFinite(prixAchat) || prixAchat < 0) {
          throw new BadRequestException("Le prix d'achat est invalide.");
        }

        const article = await tx.article.findFirst({
          where: { id: ligne.articleId, tenantId: scope.tenantId },
        });
        if (!article) {
          throw new BadRequestException(`Article ${ligne.articleId} introuvable dans ce tenant.`);
        }

        let mult = 1;
        const unite = (ligne.unite || '').toUpperCase();
        if (unite === 'CASIER') mult = article.uniteParCasier || 12;
        else if (unite === 'PACK') mult = article.uniteParPack || 6;
        else if (unite === 'PALETTE') mult = article.uniteParPalette || 120;
        else if (unite === 'PLATEAU') mult = 24;

        const qteLivreeBase = quantiteLivree * mult;
        const qteGratuiteBase = quantiteGratuite * mult;
        totalReception += prixAchat * quantiteLivree;

        linesToCreate.push({
          articleId: article.id,
          quantiteLivree: qteLivreeBase,
          quantiteGratuite: qteGratuiteBase,
          prixAchatUnitaire: prixAchat,
          uniteUsed: ligne.unite,
        });
        stockUpdates.push({ articleId: article.id, totalQte: qteLivreeBase + qteGratuiteBase });
      }

      if (montantPaye > totalReception) {
        throw new BadRequestException('Le montant payé ne peut pas dépasser le total de la réception.');
      }

      const montantDette = totalReception - montantPaye;
      const count = await tx.receptionFournisseur.count({ where: { tenantId: scope.tenantId } });
      const reference = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      const reception = await tx.receptionFournisseur.create({
        data: {
          reference,
          numBordereau: dto.numBordereau,
          statut: 'VALIDEE',
          modePaiement: dto.modePaiement as any,
          montantPaye,
          montantDette,
          fournisseurId: fournisseur.id,
          depotId: scope.depotId,
          tenantId: scope.tenantId,
          lignes: { create: linesToCreate as any },
        },
        include: { lignes: true },
      });

      for (const upd of stockUpdates) {
        if (upd.totalQte <= 0) continue;
        await tx.stock.upsert({
          where: {
            articleId_depotId: { articleId: upd.articleId, depotId: scope.depotId },
          },
          update: { quantite: { increment: upd.totalQte } },
          create: { articleId: upd.articleId, depotId: scope.depotId, quantite: upd.totalQte },
        });
        await tx.mouvementStock.create({
          data: {
            type: 'ENTREE',
            quantite: upd.totalQte,
            motif: `Réception ${reference}`,
            articleId: upd.articleId,
            depotId: scope.depotId,
            tenantId: scope.tenantId,
          },
        });
      }

      if (montantDette > 0) {
        await tx.fournisseur.update({
          where: { id: fournisseur.id },
          data: { solde: { increment: montantDette } },
        });
      }

      return reception;
    });
  }

  async findAllReceptions(tenantId: string, depotId: string) {
    const scope = this.requireScope(tenantId, depotId);
    return this.prisma.receptionFournisseur.findMany({
      where: { tenantId: scope.tenantId, depotId: scope.depotId },
      include: { fournisseur: true, depot: true, lignes: { include: { article: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async statsFournisseurs(tenantId: string, depotId: string) {
    const scope = this.requireScope(tenantId, depotId);
    const dettes = await this.prisma.fournisseur.aggregate({
      where: { tenantId: scope.tenantId, depotId: scope.depotId, solde: { gt: 0 } },
      _sum: { solde: true },
      _count: { id: true },
    });
    const receptions = await this.prisma.receptionFournisseur.count({
      where: { tenantId: scope.tenantId, depotId: scope.depotId },
    });
    return {
      totalDette: dettes._sum.solde || 0,
      nbFournisseursEnDette: dettes._count.id || 0,
      totalReceptions: receptions,
    };
  }
}
