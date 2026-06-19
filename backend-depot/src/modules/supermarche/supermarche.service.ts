import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateRayonDto {
  nom: string;
  couleur?: string;
  ordre?: number;
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

export class UpdateReceptionDto {
  statut?: 'EN_COURS' | 'VALIDEE' | 'ANNULEE';
  fournisseurId?: string;
  numBordereau?: string;
  motifAnnulation?: string;
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
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.max(1, pagination?.limit || 20);
    const search = pagination?.search;
    const skip = (page - 1) * limit;
    
    const where: any = { tenantId };
    
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.nom = { contains: search.trim() };
    }

    const [data, total] = await Promise.all([
      this.prisma.rayon.findMany({ 
        where, 
        skip, 
        take: limit 
      }),
      this.prisma.rayon.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createRayon(tenantId: string, data: any) {
    const createData: any = {
      nom: data.nom,
      tenantId,
    };
    
    if (data.couleur) {
      createData.couleur = data.couleur;
    }
    
    if (data.ordre !== undefined && data.ordre !== null) {
      createData.ordre = Math.floor(Number(data.ordre));
    }
    
    return this.prisma.rayon.create({ data: createData });
  }

  async updateRayon(id: string, tenantId: string, data: UpdateRayonDto) {
    return this.prisma.rayon.update({ where: { id, tenantId }, data });
  }

  async deleteRayon(id: string, tenantId: string) {
    return this.prisma.rayon.delete({ where: { id, tenantId } });
  }

  async assignArticleToRayon(rayonId: string, articleId: string, tenantId: string) {
    if (!articleId || typeof articleId !== 'string') {
      throw new BadRequestException('articleId invalide');
    }
    
    return this.prisma.rayonArticle.create({ data: { rayonId, articleId } });
  }

  // ── Codes-Barres ──────────────────────────────────────────────────────────

  async scanCodeBarres(code: string, tenantId: string) {
    return this.prisma.codeBarresArticle.findFirst({
      where: { code, tenantId },
      include: { article: true },
    });
  }

  async createCodeBarres(data: any, tenantId: string) {
    return this.prisma.codeBarresArticle.create({ data: { ...data, tenantId } });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ventesJour,
      caJour,
      ruptures,
      rayonsActifs,
      promosActives,
      alertesStock,
    ] = await this.prisma.$transaction([
      this.prisma.vente.count({
        where: { tenantId, date: { gte: today } },
      }),
      this.prisma.vente.aggregate({
        where: { tenantId, date: { gte: today }, statut: 'PAYE' },
        _sum: { total: true },
      }),
      this.prisma.stock.count({
        where: { article: { tenantId }, quantite: { lte: 0 } },
      }),
      this.prisma.rayon.count({
        where: { tenantId, actif: true },
      }),
      this.prisma.promotion.count({
        where: {
          tenantId,
          actif: true,
          dateDebut: { lte: new Date() },
          dateFin: { gte: new Date() },
        },
      }),
      this.prisma.stock.count({
        where: {
          article: { tenantId },
          quantite: { lte: 5 },
        },
      }),
    ]);

    const ventesByRayon = await this.prisma.ligneVente.groupBy({
      by: ['articleId'],
      where: { vente: { tenantId, date: { gte: today } } },
      _sum: { prix: true, quantite: true },
    });

    return {
      ventesJour,
      caJour: caJour._sum.total ?? 0,
      ruptures,
      rayonsActifs,
      promosActives,
      alertesStock,
      ventesByRayon,
      heuresPointe: [],
    };
  }

  // ── Articles / Produits ─────────────────────────────────────────────────────

  async findAllArticles(tenantId: string, search?: string, limit?: number) {
    const where: any = { tenantId };
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.designation = { contains: search.trim() };
    }
    const take = Number(limit) || 50;
    return this.prisma.article.findMany({
      where,
      take: Math.min(take, 100),
      include: {
        stocks: { include: { depot: true } },
        famille: true,
        rayons: { include: { rayon: true } },
        promotions: { where: { actif: true, dateFin: { gte: new Date() } } },
      },
      orderBy: { designation: 'asc' },
    });
  }

  async findArticleById(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { stocks: { include: { depot: true } }, famille: true, promotions: true },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async createArticle(tenantId: string, data: any) {
    const createData: any = {
      designation: data.designation,
      prixVente: Number(data.prixVente),
      prixAchat: data.prixAchat !== undefined ? Number(data.prixAchat) : 0,
      seuilCritique: data.seuilCritique !== undefined ? Number(data.seuilCritique) : 0,
      tenantId,
    };
    
    if (data.codeBarres) {
      createData.codeBarres = data.codeBarres;
    }
    
    if (data.familleId) {
      createData.familleId = data.familleId;
    }
    
    if (data.marqueId) {
      createData.marqueId = data.marqueId;
    }
    
    return this.prisma.article.create({ data: createData });
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
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.nom = { contains: search.trim() };
    }
    const take = Number(limit) || 50;
    return this.prisma.client.findMany({
      where,
      take: Math.min(take, 100),
      orderBy: { nom: 'asc' },
    });
  }

  async createClient(tenantId: string, data: any) {
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

  async updateClient(id: string, tenantId: string, data: any) {
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

  async createFournisseur(tenantId: string, data: any) {
    return this.prisma.fournisseur.create({
      data: {
        nom: data.nom,
        telephone: data.telephone,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async updateFournisseur(id: string, tenantId: string, data: any) {
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

  async createDepense(tenantId: string, data: any) {
    return this.prisma.depense.create({
      data: {
        categorie: data.categorie,
        montant: Number(data.montant),
        motif: data.motif,
        photoUrl: data.photoUrl,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async updateDepense(id: string, tenantId: string, data: any) {
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

  async createPromotion(tenantId: string, data: any) {
    return this.prisma.promotion.create({
      data: {
        nom: data.nom,
        type: data.type as any,
        valeur: Number(data.valeur),
        prixPromo: Number(data.prixPromo),
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        actif: data.actif ?? true,
        articleId: data.articleId,
        tenantId,
      },
    });
  }

  async updatePromotion(id: string, tenantId: string, data: any) {
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

  async createInventaire(tenantId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const ligne of data.lignes) {
        const existing = await tx.stock.findFirst({
          where: {
            articleId: ligne.articleId,
            depotId: data.depotId,
          },
          include: { depot: true },
        });
        if (!existing || existing.depot.tenantId !== tenantId) {
          throw new NotFoundException(`Stock introuvable pour article ${ligne.articleId}`);
        }

        const ecart = Number(ligne.stockPhysique) - existing.quantite;

        const updated = await tx.stock.update({
          where: { id: existing.id },
          data: { quantite: Number(ligne.stockPhysique) },
        });

        await tx.mouvementStock.create({
          data: {
            tenantId,
            articleId: ligne.articleId,
            depotId: data.depotId,
            type: 'AJUSTEMENT_INVENTAIRE',
            quantite: Math.abs(ecart),
            motif: `Inventaire - Écart: ${ecart >= 0 ? '+' : ''}${ecart}`,
          },
        });

        results.push(updated);
      }
      return { success: true, updated: results.length };
    });
  }

  // ── Ventes ──────────────────────────────────────────────────────────────────

  async createVente(tenantId: string, data: any, userId?: string) {
    console.log('=== CREATE VENTE DEBUG ===');
    if (!data.depotId) throw new BadRequestException('depotId est requis');
    if (!Array.isArray(data.panier) || data.panier.length === 0) {
      throw new BadRequestException('panier est requis');
    }
    if (!Number.isFinite(Number(data.total)) || Number(data.total) <= 0) {
      throw new BadRequestException('total vente invalide');
    }
    
    const depot = await this.prisma.depot.findFirst({
      where: { id: data.depotId, tenantId },
    });
    if (!depot) throw new BadRequestException('Dépôt introuvable ou non autorisé');
    
    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });
      if (!client) throw new BadRequestException('Client introuvable ou non autorisé');
    }
    
    for (const item of data.panier) {
      const article = await this.prisma.article.findFirst({
        where: { id: item.articleId, tenantId },
      });
      if (!article) throw new BadRequestException(`Article ${item.articleId} introuvable ou non autorisé`);
      
      const stock = await this.prisma.stock.findFirst({
        where: { articleId: item.articleId, depotId: data.depotId },
      });
      if (!stock) throw new BadRequestException(`Stock introuvable pour article ${item.articleId} dans le dépôt ${data.depotId}`);
    }
    
    let validUserId: string | null = null;
    if (userId) {
      const user = await this.prisma.user.findFirst({ where: { id: userId } });
      if (user) validUserId = userId;
    }
    
    const reference = `VENTE-${Date.now()}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const vente = await tx.vente.create({
          data: {
            reference,
            total: Number(data.total),
            statut: 'PAYE',
            modePaiement: data.modePaiement as any,
            tenantId,
            depotId: data.depotId,
            clientId: data.clientId,
            createurId: validUserId,
            date: new Date(),
            lignes: {
              create: data.panier.map((item: any) => ({
                articleId: item.articleId,
                quantite: Number(item.quantite),
                prix: Number(item.prix),
                remise: item.remise ? Number(item.remise) : 0,
                total: Number(item.quantite) * Number(item.prix) - (item.remise ? Number(item.remise) : 0),
              })),
            },
          },
          include: { lignes: true, client: true },
        });

        for (const item of data.panier) {
          await tx.stock.updateMany({
            where: { articleId: item.articleId, depotId: data.depotId },
            data: { quantite: { decrement: Number(item.quantite) } },
          });
          
          await tx.mouvementStock.create({
            data: {
              type: 'SORTIE_VENTE',
              quantite: Number(item.quantite),
              articleId: item.articleId,
              depotId: data.depotId,
              tenantId,
              motif: `Vente ${reference}`,
            },
          });
        }

        return vente;
      });
    } catch (error: any) {
      console.error('=== TRANSACTION ERROR ===', error);
      throw error;
    }
  }

 // ── Réceptions (SOLUTION MULTI-TENANT DURABLE & SÉCURISÉE) ─────────────────

  async findAllReceptions(tenantId: string) {
    const receptions = await this.prisma.receptionFournisseur.findMany({
      where: { tenantId },
      include: {
        fournisseur: true,
        depot: true,
        lignes: { include: { article: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return receptions.map((reception) => {
      // 1. Utilisation prioritaire de la somme stockée en base de données
      let total = (reception.montantPaye || 0) + (reception.montantDette || 0);

      // 2. FIABILITÉ HISTORIQUE : Si le total est à 0 mais que des lignes existent,
      // on force le recalcul dynamique pour corriger l'affichage des anciens tests.
      if (total === 0 && reception.lignes && reception.lignes.length > 0) {
        total = reception.lignes.reduce((sum, ligne) => {
          const qte = Number(ligne.quantiteLivree) || 0;
          const prix = Number(ligne.prixAchatUnitaire) || 0;
          return sum + (qte * prix);
        }, 0);
      }

      return {
        ...reception,
        montant: total, // Aligné avec 'reception.montant' dans ton frontend
        total: total,   // Double sécurité si ton frontend appelle 'reception.total'
      };
    });
  }

  async createReception(tenantId: string, data: any) {
    console.log('=== CREATE RECEPTION DEBUG ===');
    if (!data.depotId) throw new BadRequestException('depotId est requis');
    if (!data.fournisseurId) throw new BadRequestException('fournisseurId est requis');
    if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
      throw new BadRequestException('Le tableau de lignes est requis et ne doit pas être vide');
    }
    
    const depot = await this.prisma.depot.findFirst({
      where: { id: data.depotId, tenantId },
    });
    if (!depot) throw new BadRequestException('Dépôt introuvable ou non autorisé');
    
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id: data.fournisseurId, tenantId },
    });
    if (!fournisseur) throw new BadRequestException('Fournisseur introuvable ou non autorisé');
    
    // Calcul strict du coût total théorique au niveau du serveur pour figer la valeur financière
    const coutTotalMarchandise = data.lignes.reduce((sum: number, l: any) => {
      const qte = Number(l.quantiteLivree) || 0;
      const prix = Number(l.prixAchatUnitaire) || 0;
      return sum + (qte * prix);
    }, 0);

    const paye = data.montantPaye ? Number(data.montantPaye) : 0;
    // La dette est égale au coût total de la marchandise moins ce qui a été payé
    const dette = Math.max(0, coutTotalMarchandise - paye);

    // Initialisation préventive des stocks pour éviter tout crash d'intégrité référentielle
    for (const ligne of data.lignes) {
      const article = await this.prisma.article.findFirst({
        where: { id: ligne.articleId, tenantId },
      });
      if (!article) throw new BadRequestException(`Article ${ligne.articleId} introuvable`);
      
      const stock = await this.prisma.stock.findFirst({
        where: { articleId: ligne.articleId, depotId: data.depotId },
      });

      if (!stock) {
        await this.prisma.stock.create({
          data: {
            articleId: ligne.articleId,
            depotId: data.depotId,
            quantite: 0,
          }
        });
      }
    }
    
    const reference = `REC-${Date.now()}`;

    try {
      return await this.prisma.receptionFournisseur.create({
        data: {
          reference,
          modePaiement: (data.modePaiement as any) ?? 'CASH',
          montantPaye: paye,
          montantDette: dette, // Stocké durablement en BDD
          numBordereau: data.numBordereau,
          fournisseurId: data.fournisseurId,
          depotId: data.depotId,
          tenantId,
          lignes: {
            create: data.lignes.map((l: any) => ({
              articleId: l.articleId,
              quantiteLivree: Number(l.quantiteLivree),
              quantiteCommandee: Number(l.quantiteLivree),
              prixAchatUnitaire: Number(l.prixAchatUnitaire),
            })),
          },
        },
        include: { lignes: true },
      });
    } catch (error: any) {
      console.error('=== RECEPTION TRANSACTION ERROR ===', error);
      throw error;
    }
  }

async updateReception(tenantId: string, id: string, data: any) {
    const { statut, fournisseurId, numBordereau, motifAnnulation, lignes } = data;

    const reception = await this.prisma.receptionFournisseur.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });

    if (!reception) throw new NotFoundException('Réception non trouvée');

    if ((reception.statut as string) === 'VALIDEE') {
      throw new BadRequestException('Impossible de modifier une réception déjà validée');
    }

    // 1. CAS DE LA VALIDATION EN STOCK
    if (statut === 'VALIDEE' && (reception.statut as string) !== 'VALIDEE') {
      return this.prisma.$transaction(async (tx) => {
        for (const ligne of reception.lignes) {
          const qteTotale = ligne.quantiteLivree; 
          
          const targetStock = await tx.stock.findFirst({
            where: { articleId: ligne.articleId, depotId: reception.depotId }
          });

          await tx.stock.upsert({
            where: { id: targetStock?.id || '' },
            update: { quantite: { increment: qteTotale } },
            create: {
              articleId: ligne.articleId,
              depotId: reception.depotId,
              quantite: qteTotale
            }
          });
          
          await tx.mouvementStock.create({
            data: {
              type: 'ENTREE',
              quantite: qteTotale,
              articleId: ligne.articleId,
              depotId: reception.depotId,
              tenantId,
              motif: `Réception validée ${(reception as any).reference || ''}`,
            },
          });
        }

        return tx.receptionFournisseur.update({
          where: { id },
          data: { statut: 'VALIDEE' as any, fournisseurId, numBordereau },
        });
      });
    } 
    
    // 2. CAS DE LA MODIFICATION DU BROUILLON
   // 2. CAS DE LA MODIFICATION DU BROUILLON
    else {
      const montantPaye = (reception as any).montantPaye || 0;
      let coutTotalMarchandise = 0;

      if (Array.isArray(lignes)) {
        coutTotalMarchandise = lignes.reduce((sum: number, l: any) => {
          const qte = Number(l.qte) || Number(l.quantiteLivree) || 0;
          const prix = Number(l.prixUnitaire) || Number(l.prixAchatUnitaire) || 0;
          return sum + (qte * prix);
        }, 0);
      }
      const nouvelleDette = Math.max(0, coutTotalMarchandise - montantPaye);

      return this.prisma.$transaction(async (tx) => {
        // 1. On vide d'abord les anciennes lignes associées à ce brouillon
        if (lignes && Array.isArray(lignes)) {
          await tx.ligneReception.deleteMany({
            where: { receptionId: id },
          });
        }

        const updateData: any = {};
        if (fournisseurId) updateData.fournisseurId = fournisseurId;
        if (numBordereau) updateData.numBordereau = numBordereau;
        if (motifAnnulation) updateData.motifAnnulation = motifAnnulation;
        if ((reception as any).montantDette !== undefined) updateData.montantDette = nouvelleDette;

        // 2. Mapping dynamique intelligent basé sur la première ligne existante ou un fallback standard
        if (lignes && Array.isArray(lignes)) {
          // On récupère une ligne type pour inspecter ses propriétés réelles en BDD
          const uneLigneExistante = reception.lignes[0] || {};
          
          updateData.lignes = {
            create: lignes.map((l: any) => {
              const nouvelleLigne: any = {
                articleId: l.articleId,
              };

              // Détection dynamique du champ de quantité
              if ('quantiteLivree' in uneLigneExistante) {
                nouvelleLigne.quantiteLivree = Number(l.qte || l.quantiteLivree || 0);
              } else if ('quantite' in uneLigneExistante) {
                nouvelleLigne.quantite = Number(l.qte || l.quantite || 0);
              } else {
                // Fallback si la table était vide au départ
                nouvelleLigne.quantiteLivree = Number(l.qte || 0);
              }

              // Détection dynamique du champ de prix
              if ('prixAchatUnitaire' in uneLigneExistante) {
                nouvelleLigne.prixAchatUnitaire = Number(l.prixUnitaire || l.prixAchatUnitaire || 0);
              } else if ('prixUnitaire' in uneLigneExistante) {
                nouvelleLigne.prixUnitaire = Number(l.prixUnitaire || 0);
              } else {
                // Fallback si la table était vide au départ
                nouvelleLigne.prixAchatUnitaire = Number(l.prixUnitaire || 0);
              }

              // Optionnel : Gestion de la quantité commandée si le champ existe
              if ('quantiteCommandee' in uneLigneExistante) {
                nouvelleLigne.quantiteCommandee = Number(l.qte || l.quantiteCommandee || 0);
              }

              return nouvelleLigne;
            }),
          };
        }

        // 3. Exécution sécurisée
        return tx.receptionFournisseur.update({
          where: { id },
          data: updateData,
          include: { lignes: true }
        });
      });
    }
  } // <-- L'accolade qui ferme PROPREMENT updateReception

  async deleteReception(tenantId: string, id: string) {
    const reception = await this.prisma.receptionFournisseur.findFirst({
      where: { id, tenantId },
    });

    if (!reception) {
      throw new NotFoundException('Réception introuvable ou non autorisée');
    }

    if ((reception.statut as string) === 'VALIDEE') {
      throw new BadRequestException('Impossible de supprimer une réception validée');
    }

    return this.prisma.$transaction([
      this.prisma.ligneReception.deleteMany({
        where: { receptionId: id },
      }),
      this.prisma.receptionFournisseur.delete({
        where: { id },
      }),
    ]);
  } // <-- L'accolade qui ferme PROPREMENT deleteReception
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