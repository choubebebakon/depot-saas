import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class PaginationDto {
  page?: number = 1;
  limit?: number = 20;
  search?: string;
}

export class CreateRayonDto {
  nom: string;
  couleur?: string;
  ordre: number;
}

export class UpdateRayonDto {
  nom?: string;
  couleur?: string;
  ordre?: number;
}

export class AssignArticleDto {
  articleId: string;
}

export class CreateCodeBarresDto {
  code: string;
  articleId: string;
  type?: string;
}

export class CreateArticleDto {
  designation: string;
  codeBarres?: string;
  prixVente: number;
  prixAchat?: number;
  seuilCritique?: number;
  familleId?: string;
  marqueId?: string;
}

export class UpdateArticleDto {
  designation?: string;
  codeBarres?: string;
  prixVente?: number;
  prixAchat?: number;
  seuilCritique?: number;
  familleId?: string;
  marqueId?: string;
}

export class UpdateStockDto {
  stock: number;
}

export class CreateClientDto {
  nom: string;
  telephone?: string;
  adresse?: string;
  depotId?: string;
}

export class UpdateClientDto {
  nom?: string;
  telephone?: string;
  adresse?: string;
  depotId?: string;
}

export class CreateFournisseurDto {
  nom: string;
  telephone?: string;
  depotId?: string;
}

export class UpdateFournisseurDto {
  nom?: string;
  telephone?: string;
  depotId?: string;
}

export class CreateDepenseDto {
  categorie: string;
  montant: number;
  motif: string;
  photoUrl?: string;
  depotId: string;
}

export class UpdateDepenseDto {
  categorie?: string;
  montant?: number;
  motif?: string;
  photoUrl?: string;
}

export class CreatePromotionDto {
  articleId: string;
  nom: string;
  type: 'POURCENTAGE' | 'MONTANT_FIXE' | 'PRIX_FIXE';
  valeur: number;
  prixPromo: number;
  dateDebut: string;
  dateFin: string;
  actif?: boolean;
}

export class UpdatePromotionDto {
  nom?: string;
  type?: 'POURCENTAGE' | 'MONTANT_FIXE' | 'PRIX_FIXE';
  valeur?: number;
  prixPromo?: number;
  dateDebut?: string;
  dateFin?: string;
  actif?: boolean;
}

export class CreateReceptionDto {
  fournisseurId: string;
  depotId: string;
  modePaiement?: string;
  montantPaye?: number;
  numBordereau?: string;
  lignes: { articleId: string; quantiteLivree: number; prixAchatUnitaire: number }[];
}

export class CreateVenteDto {
  clientId?: string;
  modePaiement: string;
  montantRecu?: number;
  remiseGlobale?: number;
  total: number;
  depotId: string;
  panier: { articleId: string; quantite: number; prix: number; remise?: number }[];
}

export class InventaireDto {
  depotId: string;
  lignes: { articleId: string; stockPhysique: number }[];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class SupermarcheService {
  constructor(private prisma: PrismaService) {}

  // ── Rayons ──────────────────────────────────────────────────────────────────

  async findAllRayons(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) where.nom = { contains: pagination.search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.rayon.findMany({ where, skip, take: limit }),
      this.prisma.rayon.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRayon(tenantId: string, data: CreateRayonDto) {
    return this.prisma.rayon.create({ data: { ...data, tenantId } });
  }

  async updateRayon(id: string, tenantId: string, data: UpdateRayonDto) {
    return this.prisma.rayon.update({ where: { id, tenantId }, data });
  }

  async deleteRayon(id: string, tenantId: string) {
    return this.prisma.rayon.delete({ where: { id, tenantId } });
  }

  async assignArticleToRayon(rayonId: string, articleId: string, tenantId: string) {
    return this.prisma.rayonArticle.create({ data: { rayonId, articleId } });
  }

  async scanCodeBarres(code: string, tenantId: string) {
    return this.prisma.codeBarresArticle.findFirst({
      where: { code, tenantId },
      include: { article: true },
    });
  }

  async createCodeBarres(data: CreateCodeBarresDto, tenantId: string) {
    return this.prisma.codeBarresArticle.create({ data: { ...data, tenantId } });
  }

  async getStats(tenantId: string) {
    const [ventesJour, ruptures, rayonsActifs] = await Promise.all([
      this.prisma.vente.count({
        where: { tenantId, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.stock.count({
        where: { article: { tenantId }, quantite: { lte: 0 } },
      }),
      this.prisma.rayon.count({ where: { tenantId, actif: true } }),
    ]);
    return { ventesJour, ruptures, rayonsActifs, caisseJour: 0 };
  }

  // ── Articles / Produits ─────────────────────────────────────────────────────

  async findAllArticles(tenantId: string, search?: string, limit?: number) {
    const where: any = { tenantId };
    if (search) where.designation = { contains: search, mode: 'insensitive' };
    const take = Number(limit) || 50;
    const data = await this.prisma.article.findMany({
      where,
      take: Math.min(take, 100),
      include: {
        stocks: { include: { depot: true } },
        famille: true,
        promotions: { where: { actif: true, dateFin: { gte: new Date() } } },
      },
      orderBy: { designation: 'asc' },
    });
    return data;
  }

  async findArticleById(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { stocks: { include: { depot: true } }, famille: true, promotions: true },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async createArticle(tenantId: string, data: CreateArticleDto) {
    return this.prisma.article.create({
      data: {
        designation: data.designation,
        codeBarres: data.codeBarres,
        prixVente: data.prixVente,
        prixAchat: data.prixAchat ?? 0,
        seuilCritique: data.seuilCritique ?? 0,
        familleId: data.familleId,
        marqueId: data.marqueId,
        tenantId,
      },
    });
  }

  async updateArticle(id: string, tenantId: string, data: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id, tenantId },
      data,
    });
  }

  async partialUpdateArticleStock(id: string, tenantId: string, data: UpdateStockDto) {
    const article = await this.prisma.article.findFirst({ where: { id, tenantId } });
    if (!article) throw new NotFoundException('Article non trouvé');
    return this.prisma.stock.updateMany({
      where: { articleId: id, depot: { tenantId } },
      data: { quantite: data.stock },
    });
  }

  async deleteArticle(id: string, tenantId: string) {
    return this.prisma.article.delete({ where: { id, tenantId } });
  }

  // ── Clients ─────────────────────────────────────────────────────────────────

  async findAllClients(tenantId: string, search?: string, limit?: number) {
    const where: any = { tenantId };
    if (search) where.nom = { contains: search, mode: 'insensitive' };
    const take = Number(limit) || 50;
    return this.prisma.client.findMany({
      where,
      take: Math.min(take, 100),
      orderBy: { nom: 'asc' },
    });
  }

  async createClient(tenantId: string, data: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        nom: data.nom,
        telephone: data.telephone,
        adresse: data.adresse,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async updateClient(id: string, tenantId: string, data: UpdateClientDto) {
    return this.prisma.client.update({ where: { id, tenantId }, data });
  }

  async deleteClient(id: string, tenantId: string) {
    return this.prisma.client.delete({ where: { id, tenantId } });
  }

  // ── Fournisseurs ────────────────────────────────────────────────────────────

  async findAllFournisseurs(tenantId: string) {
    return this.prisma.fournisseur.findMany({
      where: { tenantId },
      orderBy: { nom: 'asc' },
    });
  }

  async createFournisseur(tenantId: string, data: CreateFournisseurDto) {
    return this.prisma.fournisseur.create({
      data: {
        nom: data.nom,
        telephone: data.telephone,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async updateFournisseur(id: string, tenantId: string, data: UpdateFournisseurDto) {
    return this.prisma.fournisseur.update({ where: { id, tenantId }, data });
  }

  async deleteFournisseur(id: string, tenantId: string) {
    return this.prisma.fournisseur.delete({ where: { id, tenantId } });
  }

  // ── Dépenses ────────────────────────────────────────────────────────────────

  async findAllDepenses(tenantId: string) {
    return this.prisma.depense.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDepense(tenantId: string, data: CreateDepenseDto) {
    return this.prisma.depense.create({
      data: {
        categorie: data.categorie,
        montant: data.montant,
        motif: data.motif,
        photoUrl: data.photoUrl,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async updateDepense(id: string, tenantId: string, data: UpdateDepenseDto) {
    return this.prisma.depense.update({ where: { id, tenantId }, data });
  }

  async deleteDepense(id: string, tenantId: string) {
    return this.prisma.depense.delete({ where: { id, tenantId } });
  }

  // ── Promotions ──────────────────────────────────────────────────────────────

  async findAllPromotions(tenantId: string) {
    return this.prisma.promotion.findMany({
      where: { tenantId },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPromotion(tenantId: string, data: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        nom: data.nom,
        type: data.type as any,
        valeur: data.valeur,
        prixPromo: data.prixPromo,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        actif: data.actif ?? true,
        articleId: data.articleId,
        tenantId,
      },
    });
  }

  async updatePromotion(id: string, tenantId: string, data: UpdatePromotionDto) {
    const updateData: any = { ...data };
    if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) updateData.dateFin = new Date(data.dateFin);
    return this.prisma.promotion.update({ where: { id, tenantId }, data: updateData });
  }

  async deletePromotion(id: string, tenantId: string) {
    return this.prisma.promotion.delete({ where: { id, tenantId } });
  }

  // ── Stock ───────────────────────────────────────────────────────────────────

  async findAllStock(tenantId: string, depotId?: string, rayonId?: string) {
    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    if (rayonId) where.article = { ...where.article, rayons: { some: { rayonId } } };
    return this.prisma.stock.findMany({
      where,
      include: {
        article: {
          include: {
            famille: true,
            rayons: { include: { rayon: true } },
          },
        },
        depot: true,
      },
      orderBy: { article: { designation: 'asc' } },
    });
  }

  async createInventaire(tenantId: string, data: InventaireDto) {
    const results: any[] = [];
    for (const ligne of data.lignes) {
      const existing = await this.prisma.stock.findFirst({
        where: { articleId: ligne.articleId, depotId: data.depotId },
      });
      if (existing) {
        const updated = await this.prisma.stock.update({
          where: { id: existing.id },
          data: { quantite: ligne.stockPhysique },
        });
        results.push(updated);
      }
    }
    return { success: true, updated: results.length };
  }

  // ── Ventes ──────────────────────────────────────────────────────────────────

  async createVente(tenantId: string, data: CreateVenteDto, userId?: string) {
    if (!data.depotId) throw new BadRequestException('depotId est requis');
    if (!Array.isArray(data.panier) || data.panier.length === 0) {
      throw new BadRequestException('panier est requis');
    }
    if (!Number.isFinite(Number(data.total)) || Number(data.total) <= 0) {
      throw new BadRequestException('total vente invalide');
    }
    const reference = `VENTE-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const vente = await tx.vente.create({
        data: {
          reference,
          total: data.total,
          statut: 'PAYE',
          modePaiement: data.modePaiement as any,
          tenantId,
          depotId: data.depotId,
          clientId: data.clientId,
          createurId: userId,
          date: new Date(),
          lignes: {
            create: data.panier.map((item) => ({
              articleId: item.articleId,
              quantite: item.quantite,
              prix: item.prix,
              remise: item.remise ?? 0,
              total: item.quantite * item.prix - (item.remise ?? 0),
            })),
          },
        },
        include: { lignes: true, client: true },
      });

      for (const item of data.panier) {
        await tx.stock.updateMany({
          where: { articleId: item.articleId, depotId: data.depotId },
          data: { quantite: { decrement: item.quantite } },
        });
        await tx.mouvementStock.create({
          data: {
            type: 'SORTIE_VENTE',
            quantite: item.quantite,
            articleId: item.articleId,
            depotId: data.depotId,
            tenantId,
            motif: `Vente ${reference}`,
          },
        });
      }

      return vente;
    });
  }

  // ── Réceptions ──────────────────────────────────────────────────────────────

  async findAllReceptions(tenantId: string) {
    return this.prisma.receptionFournisseur.findMany({
      where: { tenantId },
      include: {
        fournisseur: true,
        depot: true,
        lignes: { include: { article: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReception(tenantId: string, data: CreateReceptionDto) {
    const reference = `REC-${Date.now()}`;
    return this.prisma.receptionFournisseur.create({
      data: {
        reference,
        modePaiement: (data.modePaiement as any) ?? 'CASH',
        montantPaye: data.montantPaye ?? 0,
        numBordereau: data.numBordereau,
        fournisseurId: data.fournisseurId,
        depotId: data.depotId,
        tenantId,
        lignes: {
          create: data.lignes.map((l) => ({
            articleId: l.articleId,
            quantiteLivree: l.quantiteLivree,
            quantiteCommandee: l.quantiteLivree,
            prixAchatUnitaire: l.prixAchatUnitaire,
          })),
        },
      },
      include: { fournisseur: true, lignes: { include: { article: true } } },
    });
  }

  // ── Paramètres ──────────────────────────────────────────────────────────────

  async getParametres(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, nomEntreprise: true, emailPatron: true, telephone: true },
    });
    const depots = await this.prisma.depot.findMany({
      where: { tenantId, isArchived: false },
    });
    return { infos: { nom: tenant?.nomEntreprise ?? tenant?.name, email: tenant?.emailPatron, telephone: tenant?.telephone }, depots };
  }

  async updateParametres(tenantId: string, section: string, data: any) {
    if (section === 'infos') {
      return this.prisma.tenant.update({
        where: { id: tenantId },
        data: { nomEntreprise: data.nom, emailPatron: data.email, telephone: data.telephone },
      });
    }
    return { success: true };
  }

  // ── Rapports ────────────────────────────────────────────────────────────────

  async getRapports(tenantId: string, periode?: string, dateDebut?: string, dateFin?: string) {
    const end = dateFin ? new Date(dateFin) : new Date();
    const start = dateDebut
      ? new Date(dateDebut)
      : periode === 'mois'
        ? new Date(end.getFullYear(), end.getMonth(), 1)
        : periode === 'annee'
          ? new Date(end.getFullYear(), 0, 1)
          : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [ventes, depenses, totalVentes, totalDepenses, topArticles] = await Promise.all([
      this.prisma.vente.findMany({
        where: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
        include: { lignes: { include: { article: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.depense.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vente.aggregate({
        where: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
        _sum: { total: true },
      }),
      this.prisma.depense.aggregate({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        _sum: { montant: true },
      }),
      this.prisma.ligneVente.groupBy({
        by: ['articleId'],
        where: { vente: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' } },
        _sum: { quantite: true, total: true },
        orderBy: { _sum: { quantite: 'desc' } },
        take: 10,
      }),
    ]);

    const chiffreAffaires = totalVentes._sum.total ?? 0;
    const totalDep = totalDepenses._sum.montant ?? 0;

    return {
      periode: { debut: start, fin: end },
      chiffreAffaires,
      totalDepenses: totalDep,
      benefice: chiffreAffaires - totalDep,
      ventes,
      depenses,
      topArticles,
    };
  }

  // ── Dépôts ──────────────────────────────────────────────────────────────────

  async findAllDepots(tenantId: string) {
    return this.prisma.depot.findMany({
      where: { tenantId, isArchived: false },
      orderBy: { nom: 'asc' },
    });
  }

  // ── Reset Data ──────────────────────────────────────────────────────────────

  async resetData(tenantId: string) {
    await this.prisma.$transaction([
      this.prisma.promotion.deleteMany({ where: { tenantId } }),
      this.prisma.depense.deleteMany({ where: { tenantId } }),
      this.prisma.ligneVente.deleteMany({ where: { vente: { tenantId } } }),
      this.prisma.vente.deleteMany({ where: { tenantId } }),
      this.prisma.receptionFournisseur.deleteMany({ where: { tenantId } }),
      this.prisma.ligneReception.deleteMany({ where: { reception: { tenantId } } }),
      this.prisma.stock.deleteMany({ where: { article: { tenantId } } }),
    ]);
    return { success: true };
  }
}
