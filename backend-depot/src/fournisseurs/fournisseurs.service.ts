import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModePaiement, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { CreateReceptionDto } from './dto/create-reception.dto';

@Injectable()
export class FournisseursService {
  constructor(private readonly prisma: PrismaService) {}

  private requireScope(tenantId?: string, depotId?: string) {
    if (!tenantId) throw new ForbiddenException('Contexte tenant introuvable.');
    if (!depotId) throw new BadRequestException('Un dépôt actif est obligatoire.');
    return { tenantId, depotId };
  }

  private async assertDepotInTenant(tenantId: string, depotId: string, tx = this.prisma) {
    const depot = await tx.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true },
    });
    if (!depot) throw new ForbiddenException('Dépôt invalide ou inaccessible.');
    return depot.id;
  }

  private buildReceptionReference(tenantId: string, depotId: string, idempotencyKey: string) {
    const digest = createHash('sha256')
      .update(`${tenantId}:${depotId}:${idempotencyKey}`)
      .digest('hex');
    return `REC-${new Date().getFullYear()}-${digest.slice(0, 20)}`;
  }

  async createFournisseur(dto: CreateFournisseurDto, tenantId: string, depotId: string) {
    const scope = this.requireScope(tenantId, depotId);
    const nom = dto.nom?.trim();
    if (!nom) throw new BadRequestException('Le nom du fournisseur est obligatoire.');
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
    const fournisseurs = await this.prisma.fournisseur.findMany({
      where: { tenantId: scope.tenantId, depotId: scope.depotId },
      include: { depot: true },
      orderBy: { createdAt: 'desc' },
    });
    return fournisseurs.map((f) => ({
      ...f,
      depotName: f.depot?.nom || 'Aucun',
      solde: f.solde || 0,
    }));
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

  async createReception(
    dto: CreateReceptionDto,
    tenantId: string,
    depotId: string,
    idempotencyKey: string,
  ) {
    const scope = this.requireScope(tenantId, depotId);
    const normalizedKey = idempotencyKey?.trim();
    if (!normalizedKey || normalizedKey.length < 8 || normalizedKey.length > 128) {
      throw new BadRequestException(
        'Un en-tête x-idempotency-key valide (8 à 128 caractères) est obligatoire pour une réception.',
      );
    }

    const reference = this.buildReceptionReference(scope.tenantId, scope.depotId, normalizedKey);

    const create = async () => this.prisma.$transaction(async (tx) => {
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

      const seenArticles = new Set<string>();
      let totalReception = 0;
      const linesToCreate: Array<Record<string, unknown>> = [];
      const stockUpdates = new Map<string, number>();

      for (const ligne of dto.lignes) {
        const articleId = ligne.articleId?.trim();
        if (!articleId) throw new BadRequestException('Chaque ligne doit référencer un article.');
        if (seenArticles.has(articleId)) {
          throw new BadRequestException(
            `L'article ${articleId} apparaît plusieurs fois dans la même réception. Regroupez les quantités sur une seule ligne.`,
          );
        }
        seenArticles.add(articleId);

        const quantiteLivree = Number(ligne.quantiteLivree);
        const quantiteGratuite = Number(ligne.quantiteGratuite ?? 0);
        const prixAchat = Number(ligne.prixAchatUnitaire);
        if (!Number.isInteger(quantiteLivree) || quantiteLivree <= 0) {
          throw new BadRequestException('La quantité livrée doit être un entier strictement positif.');
        }
        if (!Number.isInteger(quantiteGratuite) || quantiteGratuite < 0) {
          throw new BadRequestException('La quantité gratuite doit être un entier positif ou nul.');
        }
        if (!Number.isFinite(prixAchat) || prixAchat < 0) {
          throw new BadRequestException("Le prix d'achat est invalide.");
        }

        const article = await tx.article.findFirst({
          where: { id: articleId, tenantId: scope.tenantId },
          select: {
            id: true,
            uniteParCasier: true,
            uniteParPack: true,
            uniteParPalette: true,
          },
        });
        if (!article) {
          throw new BadRequestException(`Article ${articleId} introuvable dans ce tenant.`);
        }

        const unite = (ligne.unite || 'PIECE').toUpperCase();
        let mult = 1;
        if (unite === 'CASIER') mult = article.uniteParCasier;
        else if (unite === 'PACK') mult = article.uniteParPack;
        else if (unite === 'PALETTE') mult = article.uniteParPalette;
        else if (unite === 'PLATEAU') mult = 24;
        else if (unite !== 'PIECE' && unite !== 'BOUTEILLE') {
          throw new BadRequestException(`Unité de réception non supportée: ${unite}.`);
        }
        if (!Number.isInteger(mult) || mult <= 0) {
          throw new BadRequestException(`Coefficient de conversion invalide pour l'article ${article.id}.`);
        }

        const qteLivreeBase = quantiteLivree * mult;
        const qteGratuiteBase = quantiteGratuite * mult;
        totalReception += prixAchat * quantiteLivree;

        linesToCreate.push({
          articleId: article.id,
          quantiteLivree: qteLivreeBase,
          quantiteGratuite: qteGratuiteBase,
          prixAchatUnitaire: prixAchat,
          uniteUsed: unite,
        });
        stockUpdates.set(
          article.id,
          (stockUpdates.get(article.id) || 0) + qteLivreeBase + qteGratuiteBase,
        );
      }

      if (montantPaye > totalReception) {
        throw new BadRequestException('Le montant payé ne peut pas dépasser le total de la réception.');
      }
      if (dto.modePaiement === ModePaiement.CREDIT && montantPaye !== 0) {
        throw new BadRequestException('Une réception en crédit ne peut pas avoir de paiement immédiat.');
      }

      const montantDette = totalReception - montantPaye;

      const reception = await tx.receptionFournisseur.create({
        data: {
          reference,
          numBordereau: dto.numBordereau?.trim() || null,
          statut: 'VALIDEE',
          modePaiement: dto.modePaiement,
          montantPaye,
          montantDette,
          fournisseurId: fournisseur.id,
          depotId: scope.depotId,
          tenantId: scope.tenantId,
          lignes: { create: linesToCreate as any },
        },
        include: { lignes: true },
      });

      for (const [articleId, totalQte] of stockUpdates) {
        if (totalQte <= 0) continue;
        await tx.stock.upsert({
          where: { articleId_depotId: { articleId, depotId: scope.depotId } },
          update: { quantite: { increment: totalQte } },
          create: { articleId, depotId: scope.depotId, quantite: totalQte },
        });
        await tx.mouvementStock.create({
          data: {
            type: 'ENTREE',
            quantite: totalQte,
            motif: `Réception ${reference}`,
            articleId,
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    try {
      return await create();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.receptionFournisseur.findFirst({
          where: {
            reference,
            tenantId: scope.tenantId,
            depotId: scope.depotId,
          },
          include: { lignes: true },
        });
        if (existing) return existing;
        throw new ConflictException('Une réception concurrente utilise déjà cette référence.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException(
          'La réception a rencontré une concurrence. Réessayez avec la même clé d’idempotence.',
        );
      }
      throw error;
    }
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
