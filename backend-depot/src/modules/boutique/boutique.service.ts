import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Promotion, Article, Stock, Client, Fournisseur, Depense, User } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Promotion> {
    return this.prisma.promotion.create({ data });
  }

  async findAll(tenantId: string): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({ where: { tenantId } });
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
}
