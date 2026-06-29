import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { CreateReceptionDto } from './dto/create-reception.dto';

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException('depotId est obligatoire.');
    }
    return depotId;
  }

  // ── Fournisseurs ─────────────────────────────────────────

  async createFournisseur(dto: any) {
    // 'any' permet d'accepter tous les champs du DTO
    if (!dto.nom) {
      throw new BadRequestException('Le nom du fournisseur est obligatoire.');
    }

    const initialAmount = Number(dto.soldeInitial) || 0;

    return this.prisma.fournisseur.create({
      data: {
        nom: dto.nom,
        telephone: dto.telephone || null,
        email: dto.email || null,
        adresse: dto.adresse || null,
        soldeInitial: initialAmount,
        solde: initialAmount,
        notes: dto.notes || null,
        depotId: dto.depotId || null,
        tenantId: dto.tenantId,
      },
    });
  }

  async findAllFournisseurs(tenantId: string) {
    const fournisseurs = await this.prisma.fournisseur.findMany({
      where: { tenantId },
      include: { depot: true },
      orderBy: { createdAt: 'desc' },
    });

    // Mapping pour garantir les clés 'depotName' et 'solde' au frontend
    return fournisseurs.map((f) => ({
      ...f,
      depotName: f.depot?.nom || 'Aucun',
      solde: f.solde || 0,
    }));
  }

  async updateFournisseur(tenantId: string, id: string, dto: any) {
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId },
    });

    if (!fournisseur) throw new NotFoundException('Fournisseur introuvable');

    return this.prisma.fournisseur.update({
      where: { id },
      data: {
        nom: dto.nom || fournisseur.nom,
        telephone:
          dto.telephone !== undefined ? dto.telephone : fournisseur.telephone,
        email: dto.email !== undefined ? dto.email : fournisseur.email,
        adresse: dto.adresse !== undefined ? dto.adresse : fournisseur.adresse,
        notes: dto.notes !== undefined ? dto.notes : fournisseur.notes,
        depotId: dto.depotId !== undefined ? dto.depotId : fournisseur.depotId,
        soldeInitial:
          dto.soldeInitial !== undefined
            ? Number(dto.soldeInitial)
            : fournisseur.soldeInitial,
      },
    });
  }

  async deleteFournisseur(tenantId: string, id: string) {
    const slots = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { receptions: true } } },
    });

    if (!slots) throw new NotFoundException('Fournisseur introuvable');
    if (slots._count.receptions > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce fournisseur car des réceptions y sont rattachées.',
      );
    }

    return this.prisma.fournisseur.delete({ where: { id } });
  }

  // ── Réceptions ────────────────────────────────────────────

  async createReception(dto: CreateReceptionDto) {
    return await this.prisma.$transaction(async (tx) => {
      let totalReception = 0;
      const linesToCreate: any[] = [];
      const stockUpdates: any[] = [];

      for (const ligne of dto.lignes) {
        const article = await tx.article.findUnique({
          where: { id: ligne.articleId },
        });
        if (!article)
          throw new BadRequestException(
            `Article ${ligne.articleId} introuvable`,
          );

        let mult = 1;
        const u = (ligne.unite || '').toUpperCase();
        if (u === 'CASIER') mult = article.uniteParCasier || 12;
        else if (u === 'PACK') mult = article.uniteParPack || 6;
        else if (u === 'PALETTE') mult = article.uniteParPalette || 120;
        else if (u === 'PLATEAU') mult = 24;

        const qteLivreeBase = ligne.quantiteLivree * mult;
        const qteGratuiteBase = ligne.quantiteGratuite * mult;
        totalReception += ligne.prixAchatUnitaire * ligne.quantiteLivree;

        linesToCreate.push({
          articleId: article.id,
          quantiteLivree: qteLivreeBase,
          quantiteGratuite: qteGratuiteBase,
          prixAchatUnitaire: ligne.prixAchatUnitaire,
          uniteUsed: ligne.unite,
        });

        stockUpdates.push({
          articleId: article.id,
          totalQte: qteLivreeBase + qteGratuiteBase,
          unite: ligne.unite,
        });
      }

      const montantDette = Math.max(0, totalReception - dto.montantPaye);
      const count = await tx.receptionFournisseur.count({
        where: { tenantId: dto.tenantId },
      });
      const reference = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      const reception = await tx.receptionFournisseur.create({
        data: {
          reference,
          numBordereau: dto.numBordereau,
          statut: 'VALIDEE',
          modePaiement: dto.modePaiement as any,
          montantPaye: dto.montantPaye,
          montantDette,
          fournisseurId: dto.fournisseurId,
          depotId: dto.depotId,
          tenantId: dto.tenantId,
          lignes: { create: linesToCreate },
        },
        include: { lignes: true },
      });

      for (const upd of stockUpdates) {
        if (upd.totalQte <= 0) continue;
        await tx.stock.upsert({
          where: {
            articleId_depotId: {
              articleId: upd.articleId,
              depotId: dto.depotId,
            },
          },
          update: { quantite: { increment: upd.totalQte } },
          create: {
            articleId: upd.articleId,
            depotId: dto.depotId,
            quantite: upd.totalQte,
          },
        });
        await tx.mouvementStock.create({
          data: {
            type: 'ENTREE',
            quantite: upd.totalQte,
            motif: `Réception ${reference}`,
            articleId: upd.articleId,
            depotId: dto.depotId,
            tenantId: dto.tenantId,
          },
        });
      }

      if (montantDette > 0) {
        await tx.fournisseur.update({
          where: { id: dto.fournisseurId },
          data: { solde: { increment: montantDette } },
        });
      }

      return reception;
    });
  }

  async findAllReceptions(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    return this.prisma.receptionFournisseur.findMany({
      where: { tenantId, depotId: selectedDepotId },
      include: {
        fournisseur: true,
        depot: true,
        lignes: { include: { article: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async statsFournisseurs(tenantId: string) {
    const dettes = await this.prisma.fournisseur.aggregate({
      where: { tenantId, solde: { gt: 0 } },
      _sum: { solde: true },
      _count: { id: true },
    });
    const receptions = await this.prisma.receptionFournisseur.count({
      where: { tenantId },
    });
    return {
      totalDette: dettes._sum.solde || 0,
      nbFournisseursEnDette: dettes._count.id || 0,
      totalReceptions: receptions,
    };
  }
}
