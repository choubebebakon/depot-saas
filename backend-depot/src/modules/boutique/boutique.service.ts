import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Promotion, Article, Stock, Client, Fournisseur, Depense, User } from '@prisma/client';
import { CATEGORIES_PAR_TYPE } from '../../../prisma/seeds/categoriesBoutique';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Promotion> {
    return this.prisma.promotion.create({ data });
  }

  async findAll(tenantId: string): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({ where: { tenantId } });
  }

  async findOne(id: string, tenantId: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: { article: true },
    });
    if (!promotion) throw new NotFoundException('Promotion non trouvée');
    return promotion;
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.promotion.update({
      where: { id },
      data,
      include: { article: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.promotion.delete({ where: { id } });
  }
}

@Injectable()
export class CreditClientService {
  constructor(private prisma: PrismaService) {}
  // Logic...
}

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const { page = 1, limit = 50, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { designation: { contains: search, mode: 'insensitive' } },
        { codeBarres: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: { famille: true, marque: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { famille: true, marque: true },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async create(data: any, tenantId: string) {
    return this.prisma.article.create({
      data: { ...data, tenantId },
      include: { famille: true, marque: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.article.update({
      where: { id },
      data,
      include: { famille: true, marque: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.article.delete({ where: { id } });
  }
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, depotId?: string, params?: any) {
    const { page = 1, limit = 50, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    if (search) {
      where.article = {
        designation: { contains: search, mode: 'insensitive' },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.stock.findMany({
        where,
        skip,
        take: limit,
        include: { article: { include: { famille: true, marque: true } }, depot: true },
        orderBy: { quantite: 'asc' },
      }),
      this.prisma.stock.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const { page = 1, limit = 50, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: { depot: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: { depot: true },
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
  }

  async create(data: any, tenantId: string) {
    return this.prisma.client.create({
      data: { ...data, tenantId },
      include: { depot: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.client.update({
      where: { id },
      data,
      include: { depot: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.client.delete({ where: { id } });
  }
}

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const { page = 1, limit = 50, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.fournisseur.findMany({
        where,
        skip,
        take: limit,
        include: { depot: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fournisseur.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId },
      include: { depot: true },
    });
    if (!fournisseur) throw new NotFoundException('Fournisseur non trouvé');
    return fournisseur;
  }

  async create(data: any, tenantId: string) {
    return this.prisma.fournisseur.create({
      data: { ...data, tenantId },
      include: { depot: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.fournisseur.update({
      where: { id },
      data,
      include: { depot: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.fournisseur.delete({ where: { id } });
  }
}

@Injectable()
export class DepensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const { page = 1, limit = 50, categorie } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (categorie) where.categorie = categorie;

    const [data, total] = await Promise.all([
      this.prisma.depense.findMany({
        where,
        skip,
        take: limit,
        include: { depot: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.depense.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const depense = await this.prisma.depense.findFirst({
      where: { id, tenantId },
      include: { depot: true },
    });
    if (!depense) throw new NotFoundException('Dépense non trouvée');
    return depense;
  }

  async create(data: any, tenantId: string) {
    return this.prisma.depense.create({
      data: { ...data, tenantId },
      include: { depot: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.depense.update({
      where: { id },
      data,
      include: { depot: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.depense.delete({ where: { id } });
  }
}

@Injectable()
export class PersonnelService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const { page = 1, limit = 50, search, role } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isActive: true };
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { depot: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: { depot: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async create(data: any, tenantId: string) {
    return this.prisma.user.create({
      data: { ...data, tenantId },
      include: { depot: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data,
      include: { depot: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

@Injectable()
export class VentesService {
  constructor(private prisma: PrismaService) {}

  async createVente(tenantId: string, data: any, userId?: string) {
    if (!data.depotId) throw new Error('depotId est requis');
    if (!Array.isArray(data.panier) || data.panier.length === 0) {
      throw new Error('panier est requis');
    }
    if (!Number.isFinite(Number(data.total)) || Number(data.total) <= 0) {
      throw new Error('total vente invalide');
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

  async findAll(tenantId: string, params?: any) {
    const { page = 1, limit = 50, statut, clientId } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (statut) where.statut = statut;
    if (clientId) where.clientId = clientId;

    const [data, total] = await Promise.all([
      this.prisma.vente.findMany({
        where,
        skip,
        take: limit,
        include: { lignes: { include: { article: true } }, client: true, depot: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.vente.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: { include: { article: true } }, client: true, depot: true },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    return vente;
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

  // ── Stats / Dashboard ────────────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ventesJour,
      caJour,
      clientsActifs,
      stockCritique,
      totalProduits,
    ] = await this.prisma.$transaction([
      // Nombre de ventes aujourd'hui
      this.prisma.vente.count({
        where: { tenantId, date: { gte: today } },
      }),
      // CA jour (ventes PAYE)
      this.prisma.vente.aggregate({
        where: { tenantId, date: { gte: today }, statut: 'PAYE' },
        _sum: { total: true },
      }),
      // Clients actifs (tous les clients, pas de champ actif)
      this.prisma.client.count({
        where: { tenantId },
      }),
      // Ruptures (quantite <= seuilCritique ou <= 0 si seuilCritique null)
      this.prisma.stock.count({
        where: {
          article: { tenantId },
          quantite: { lte: 0 },
        },
      }),
      // Total produits (tous les articles, pas de champ actif)
      this.prisma.article.count({
        where: { tenantId },
      }),
    ]);

    return {
      ventesJour,
      caJour: caJour._sum.total ?? 0,
      clientsActifs,
      stockCritique,
      totalProduits,
      caisseJour: caJour._sum.total ?? 0, // Alias pour compatibilité frontend
    };
  }

  // ── Catégories ───────────────────────────────────────────────────────────────

  async findAllCategories(tenantId: string, query?: any) {
    return this.prisma.categorie.findMany({
      where: { tenantId, actif: true },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
      include: { _count: { select: { articles: true } } },
    });
  }

  async findOneCategorie(tenantId: string, id: string) {
    const cat = await this.prisma.categorie.findFirst({
      where: { id, tenantId },
      include: { articles: true },
    });
    if (!cat) throw new NotFoundException(`Catégorie ${id} introuvable`);
    return cat;
  }

  async createCategorie(tenantId: string, dto: any) {
    return this.prisma.categorie.create({
      data: { ...dto, tenantId },
    });
  }

  async updateCategorie(tenantId: string, id: string, dto: any) {
    await this.findOneCategorie(tenantId, id);
    return this.prisma.categorie.update({ where: { id }, data: dto });
  }

  async deleteCategorie(tenantId: string, id: string) {
    await this.findOneCategorie(tenantId, id);
    // Vérifier qu'aucun article n'utilise cette catégorie
    const count = await this.prisma.article.count({
      where: { categorieId: id, tenantId },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${count} article(s) utilisent cette catégorie`
      );
    }
    return this.prisma.categorie.delete({ where: { id } });
  }

  async seedCategoriesByType(tenantId: string, typeBoutique: string) {
    const cats = CATEGORIES_PAR_TYPE[typeBoutique] ?? CATEGORIES_PAR_TYPE.generique;
    const created = await this.prisma.$transaction(
      cats.map((cat, index) =>
        this.prisma.categorie.create({
          data: { ...cat, tenantId, ordre: index },
        })
      )
    );
    return { created: created.length, type: typeBoutique };
  }
}
