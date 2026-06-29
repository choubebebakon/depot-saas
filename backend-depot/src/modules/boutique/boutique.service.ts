import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CATEGORIES_PAR_TYPE } from '../../../prisma/seeds/categoriesBoutique';

// ── Helper ──────────────────────────────────────────────────────────────────

function toPositiveInt(val: any, fallback: number): number {
  const n = parseInt(String(val));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function requireString(val: any, field: string): string {
  if (!val || typeof val !== 'string' || !val.trim()) {
    throw new BadRequestException(`Le champ "${field}" est requis.`);
  }
  return val.trim();
}

// ── Promotions ───────────────────────────────────────────────────────────────

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, tenantId: string) {
    requireString(data.articleId, 'articleId');
    requireString(data.nom, 'nom');
    if (!data.dateDebut) throw new BadRequestException('dateDebut est requis');
    if (!data.dateFin) throw new BadRequestException('dateFin est requis');
    const valeur = parseFloat(data.valeur);
    if (!Number.isFinite(valeur) || valeur < 0)
      throw new BadRequestException('valeur invalide');

    return this.prisma.promotion.create({
      data: {
        tenantId,
        articleId: data.articleId,
        nom: data.nom,
        type: data.type || 'POURCENTAGE',
        valeur,
        prixPromo: parseFloat(data.prixPromo) || 0,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        actif: data.actif !== undefined ? Boolean(data.actif) : true,
      },
      include: { article: true },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.promotion.findMany({
      where: { tenantId },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
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
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.valeur !== undefined) updateData.valeur = parseFloat(data.valeur);
    if (data.prixPromo !== undefined) updateData.prixPromo = parseFloat(data.prixPromo);
    if (data.dateDebut !== undefined) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin !== undefined) updateData.dateFin = new Date(data.dateFin);
    if (data.actif !== undefined) updateData.actif = Boolean(data.actif);
    if (data.articleId !== undefined) updateData.articleId = data.articleId;

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
      include: { article: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.promotion.delete({ where: { id } });
  }
}

// ── CreditClient stub ────────────────────────────────────────────────────────

@Injectable()
export class CreditClientService {
  constructor(private prisma: PrismaService) {}
}

// ── Articles ─────────────────────────────────────────────────────────────────

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const categorieId = params?.categorieId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { designation: { contains: search, mode: 'insensitive' } },
        { codeBarres: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categorieId && categorieId !== '') {
      where.categorieId = categorieId;
    }

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: { famille: true, marque: true, categorie: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { famille: true, marque: true, categorie: true },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async create(data: any, tenantId: string) {
    requireString(data.designation, 'designation');
    const prixVente = parseFloat(data.prixVente);
    if (!Number.isFinite(prixVente) || prixVente < 0)
      throw new BadRequestException('prixVente invalide');

    return this.prisma.article.create({
      data: {
        tenantId,
        designation: data.designation.trim(),
        prixVente,
        prixAchat: parseFloat(data.prixAchat) || 0,
        seuilCritique: parseInt(data.seuilCritique) || 0,
        codeBarres: data.codeBarres || null,
        unite: data.unite || 'PIECE',
        familleId: data.familleId || null,
        marqueId: data.marqueId || null,
        categorieId: data.categorieId || null,
      },
      include: { famille: true, marque: true, categorie: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.designation !== undefined) updateData.designation = data.designation.trim();
    if (data.prixVente !== undefined) updateData.prixVente = parseFloat(data.prixVente);
    if (data.prixAchat !== undefined) updateData.prixAchat = parseFloat(data.prixAchat) || 0;
    if (data.seuilCritique !== undefined) updateData.seuilCritique = parseInt(data.seuilCritique) || 0;
    if (data.codeBarres !== undefined) updateData.codeBarres = data.codeBarres || null;
    if (data.unite !== undefined) updateData.unite = data.unite;
    if (data.familleId !== undefined) updateData.familleId = data.familleId || null;
    if (data.marqueId !== undefined) updateData.marqueId = data.marqueId || null;
    if (data.categorieId !== undefined) updateData.categorieId = data.categorieId || null;

    return this.prisma.article.update({
      where: { id },
      data: updateData,
      include: { famille: true, marque: true, categorie: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.article.delete({ where: { id } });
  }
}

// ── Stock ────────────────────────────────────────────────────────────────────

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, depotId?: string | null, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const categorieId = params?.categorieId;
    const skip = (page - 1) * limit;

    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    if (search) {
      where.article = {
        ...where.article,
        designation: { contains: search, mode: 'insensitive' },
      };
    }
    if (categorieId && categorieId !== '') {
      where.article = { ...where.article, categorieId };
    }

    const [data, total] = await Promise.all([
      this.prisma.stock.findMany({
        where,
        skip,
        take: limit,
        include: {
          article: { include: { famille: true, marque: true, categorie: true } },
          depot: true,
        },
        orderBy: { quantite: 'asc' },
      }),
      this.prisma.stock.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

// ── Clients ──────────────────────────────────────────────────────────────────

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
  }

  async create(data: any, tenantId: string) {
    requireString(data.nom, 'nom');
    return this.prisma.client.create({
      data: {
        tenantId,
        nom: data.nom.trim(),
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        depotId: data.depotId || null,
        plafondCredit: parseFloat(data.plafondCredit) || 0,
        soldeCredit: parseFloat(data.soldeCredit) || 0,
      },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.depotId !== undefined) updateData.depotId = data.depotId || null;
    if (data.plafondCredit !== undefined)
      updateData.plafondCredit = parseFloat(data.plafondCredit) || 0;

    return this.prisma.client.update({ where: { id }, data: updateData });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.client.delete({ where: { id } });
  }
}

// ── Fournisseurs ─────────────────────────────────────────────────────────────

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fournisseur.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId },
    });
    if (!fournisseur) throw new NotFoundException('Fournisseur non trouvé');
    return fournisseur;
  }

  async create(data: any, tenantId: string) {
    requireString(data.nom, 'nom');
    return this.prisma.fournisseur.create({
      data: {
        tenantId,
        nom: data.nom.trim(),
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        email: data.email || null,
        notes: data.notes || null,
        depotId: data.depotId || null,
      },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    return this.prisma.fournisseur.update({ where: { id }, data: updateData });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.fournisseur.delete({ where: { id } });
  }
}

// ── Dépenses ─────────────────────────────────────────────────────────────────

@Injectable()
export class DepensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const depotId = params?.depotId;
    const categorie = params?.categorie;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
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
    // Le frontend envoie : libelle (alias motif), montant, categorie, modePaiement (ignoré), notes (ignoré)
    // Le modèle Prisma Depense accepte : categorie, montant, motif, depotId, tenantId
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    requireString(data.depotId, 'depotId');

    // Map libelle → motif (le frontend peut envoyer l'un ou l'autre)
    const motif = data.libelle || data.motif || '';

    return this.prisma.depense.create({
      data: {
        tenantId,
        depotId: data.depotId,
        categorie: data.categorie || 'AUTRE',
        montant,
        motif,
      },
      include: { depot: true },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.montant !== undefined) updateData.montant = parseFloat(data.montant);
    if (data.categorie !== undefined) updateData.categorie = data.categorie;
    if (data.libelle !== undefined || data.motif !== undefined) {
      updateData.motif = data.libelle || data.motif || '';
    }

    return this.prisma.depense.update({
      where: { id },
      data: updateData,
      include: { depot: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.depense.delete({ where: { id } });
  }
}

// ── Personnel ─────────────────────────────────────────────────────────────────

@Injectable()
export class PersonnelService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const search = params?.search;
    const role = params?.role;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isActive: true };
    if (depotId) where.depotId = depotId;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    // Mapper VENDEUR → COMMERCIAL pour la recherche
    if (role) where.role = role === 'VENDEUR' ? 'COMMERCIAL' : role;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          depotId: true,
          createdAt: true,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        depotId: true,
        createdAt: true,
        isActive: true,
      },
    });
    if (!user) throw new NotFoundException('Employé non trouvé');
    return user;
  }

  async create(data: any, tenantId: string) {
    requireString(data.nom, 'nom');
    requireString(data.email, 'email');
    // Mapper VENDEUR → COMMERCIAL (enum Prisma)
    const role = data.role === 'VENDEUR' ? 'COMMERCIAL' : (data.role || 'COMMERCIAL');

    // Vérifier si email déjà utilisé dans ce tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email, tenantId },
    });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    return this.prisma.user.create({
      data: {
        tenantId,
        nom: data.nom.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password || `TEMP_${Date.now()}`, // password temporaire
        role: role as any,
        depotId: data.depotId || null,
        isActive: true,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        depotId: true,
        createdAt: true,
        isActive: true,
      },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) {
      updateData.role = data.role === 'VENDEUR' ? 'COMMERCIAL' : data.role;
    }
    if (data.depotId !== undefined) updateData.depotId = data.depotId || null;
    if (data.telephone !== undefined) {
      // telephone n'est pas dans le modèle User — ignorer silencieusement
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        depotId: true,
        createdAt: true,
        isActive: true,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    // Soft delete : marquer isActive = false
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }
}

// ── Ventes ────────────────────────────────────────────────────────────────────

@Injectable()
export class VentesService {
  constructor(private prisma: PrismaService) {}

  async createVente(tenantId: string, data: any, userId?: string) {
    requireString(data.depotId, 'depotId');
    if (!Array.isArray(data.panier) || data.panier.length === 0) {
      throw new BadRequestException('Le panier est vide ou invalide');
    }

    // Calculer le total côté serveur pour éviter la manipulation
    const sousTotal = data.panier.reduce((sum: number, item: any) => {
      const prix = parseFloat(item.prix) || 0;
      const quantite = parseInt(item.quantite) || 0;
      const remise = parseFloat(item.remise) || 0;
      return sum + prix * quantite * (1 - remise / 100);
    }, 0);

    const remiseGlobale = parseFloat(data.remiseGlobale) || 0;
    const total = sousTotal * (1 - remiseGlobale / 100);

    if (!Number.isFinite(total) || total <= 0)
      throw new BadRequestException('Total de vente invalide');

    const reference = `VENTE-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const vente = await tx.vente.create({
        data: {
          reference,
          total: Math.round(total * 100) / 100,
          statut: 'PAYE',
          modePaiement: data.modePaiement || 'CASH',
          tenantId,
          depotId: data.depotId,
          clientId: data.clientId || null,
          createurId: userId || null,
          date: new Date(),
          lignes: {
            create: data.panier.map((item: any) => ({
              articleId: item.articleId,
              quantite: parseInt(item.quantite),
              prix: parseFloat(item.prix),
              remise: parseFloat(item.remise) || 0,
              total:
                parseFloat(item.prix) *
                parseInt(item.quantite) *
                (1 - (parseFloat(item.remise) || 0) / 100),
            })),
          },
        },
        include: {
          lignes: { include: { article: { select: { designation: true } } } },
          client: true,
        },
      });

      // Décrémenter le stock et créer les mouvements
      for (const item of data.panier) {
        await tx.stock.updateMany({
          where: { articleId: item.articleId, depotId: data.depotId },
          data: { quantite: { decrement: parseInt(item.quantite) } },
        });
        await tx.mouvementStock.create({
          data: {
            type: 'SORTIE_VENTE',
            quantite: parseInt(item.quantite),
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
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);

    // Statut peut être filtré depuis les alias (ex: factures = PAYE)
    const statut = params?.statut;
    const clientId = params?.clientId;
    const depotId = params?.depotId;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    // Par défaut : si une couche supérieure impose un statut, on l'applique.
    // (Pour factures, le controller force statut='PAYE')
    if (statut) where.statut = statut;

    if (clientId) where.clientId = clientId;
    if (depotId) where.depotId = depotId;

    const [data, total] = await Promise.all([
      this.prisma.vente.findMany({
        where,
        skip,
        take: limit,
        include: {
          lignes: { include: { article: { select: { designation: true } } } },
          client: { select: { nom: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.vente.count({ where }),
    ]);

    return { data, total, page, limit };
  }


  async findOne(id: string, tenantId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: { select: { designation: true } } } },
        client: true,
      },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    return vente;
  }

  async annulerVente(id: string, tenantId: string, motif?: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    if (vente.statut === 'ANNULE')
      throw new BadRequestException('Cette vente est déjà annulée');

    return this.prisma.$transaction(async (tx) => {
      await tx.vente.update({
        where: { id },
        data: { statut: 'ANNULE', motifAnnulation: motif || 'Annulation manuelle' },
      });
      // Réintégrer le stock
      for (const ligne of vente.lignes) {
        await tx.stock.updateMany({
          where: { articleId: ligne.articleId, depotId: vente.depotId },
          data: { quantite: { increment: ligne.quantite } },
        });
      }
      return { success: true };
    });
  }

  // ── Rapports ───────────────────────────────────────────────────────────────

  async getRapports(
    tenantId: string,
    periode?: string,
    dateDebut?: string,
    dateFin?: string,
  ) {
    const end = dateFin ? new Date(dateFin) : new Date();
    const start = dateDebut
      ? new Date(dateDebut)
      : periode === 'mois'
        ? new Date(end.getFullYear(), end.getMonth(), 1)
        : periode === 'annee'
          ? new Date(end.getFullYear(), 0, 1)
          : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [ventes, depenses, totalVentes, totalDepenses, topArticles] =
      await Promise.all([
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
          where: {
            vente: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          },
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

  // ── Stats / Dashboard ─────────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ventesJour, caJour, clientsActifs, stockCritique, totalProduits] =
      await this.prisma.$transaction([
        this.prisma.vente.count({
          where: { tenantId, date: { gte: today }, statut: 'PAYE' },
        }),
        this.prisma.vente.aggregate({
          where: { tenantId, date: { gte: today }, statut: 'PAYE' },
          _sum: { total: true },
        }),
        this.prisma.client.count({ where: { tenantId } }),
        this.prisma.stock.count({
          where: {
            article: { tenantId },
            OR: [
              { quantite: { lte: 0 } },
              {
                AND: [
                  { quantite: { gt: 0 } },
                  { seuilCritique: { not: null } },
                ],
              },
            ],
          },
        }),
        this.prisma.article.count({ where: { tenantId } }),
      ]);

    return {
      ventesJour,
      caJour: caJour._sum.total ?? 0,
      clientsActifs,
      stockCritique,
      totalProduits,
      caisseJour: caJour._sum.total ?? 0,
    };
  }

  // ── Catégories ────────────────────────────────────────────────────────────

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
    requireString(dto.nom, 'nom');
    return this.prisma.categorie.create({
      data: {
        tenantId,
        nom: dto.nom.trim(),
        description: dto.description || null,
        couleur: dto.couleur || '#6366f1',
        icone: dto.icone || '🏷️',
        actif: dto.actif !== undefined ? Boolean(dto.actif) : true,
        ordre: Number.isFinite(Number(dto.ordre)) ? Number(dto.ordre) : 0,
      },
    });
  }

  async updateCategorie(tenantId: string, id: string, dto: any) {
    await this.findOneCategorie(tenantId, id);
    const updateData: any = {};
    if (dto.nom !== undefined) updateData.nom = dto.nom.trim();
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.couleur !== undefined) updateData.couleur = dto.couleur;
    if (dto.icone !== undefined) updateData.icone = dto.icone;
    if (dto.actif !== undefined) updateData.actif = Boolean(dto.actif);
    if (dto.ordre !== undefined) {
      const n = Number(dto.ordre);
      updateData.ordre = Number.isFinite(n) ? n : 0;
    }
    return this.prisma.categorie.update({ where: { id }, data: updateData });
  }

  async deleteCategorie(tenantId: string, id: string) {
    await this.findOneCategorie(tenantId, id);
    const count = await this.prisma.article.count({
      where: { categorieId: id, tenantId },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${count} article(s) utilisent cette catégorie`,
      );
    }
    return this.prisma.categorie.delete({ where: { id } });
  }

  async seedCategoriesByType(tenantId: string, typeBoutique: string) {
    const cats =
      CATEGORIES_PAR_TYPE[typeBoutique] ?? CATEGORIES_PAR_TYPE.generique;
    const created = await this.prisma.$transaction(
      cats.map((cat, index) =>
        this.prisma.categorie.create({
          data: { ...cat, tenantId, ordre: index },
        }),
      ),
    );
    return { created: created.length, type: typeBoutique };
  }
}
