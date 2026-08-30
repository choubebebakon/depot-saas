import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AuditSeverite } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// ── Helper ──────────────────────────────────────────────────────────────────

function requireString(val: any, field: string): string {
  if (!val || typeof val !== 'string' || !val.trim()) {
    throw new BadRequestException(`Le champ "${field}" est requis.`);
  }
  return val.trim();
}

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
  lignes: {
    articleId: string;
    quantiteLivree: number;
    prixAchatUnitaire: number;
  }[];
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
  panier: {
    articleId: string;
    quantite: number;
    prix: number;
    remise?: number;
  }[];
}

export class InventaireDto {
  depotId: string;
  lignes: { articleId: string; stockPhysique: number }[];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class SupermarcheService {
  private readonly logger = new Logger(SupermarcheService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

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
        take: limit,
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

  async assignArticleToRayon(
    rayonId: string,
    articleId: string,
    tenantId: string,
  ) {
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
    return this.prisma.codeBarresArticle.create({
      data: { ...data, tenantId },
    });
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
      include: {
        stocks: { include: { depot: true } },
        famille: true,
        promotions: true,
      },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async createArticle(tenantId: string, data: any) {
    const createData: any = {
      designation: data.designation,
      prixVente: Number(data.prixVente),
      prixAchat: data.prixAchat !== undefined ? Number(data.prixAchat) : 0,
      seuilCritique:
        data.seuilCritique !== undefined ? Number(data.seuilCritique) : 0,
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

  async partialUpdateArticleStock(
    id: string,
    tenantId: string,
    data: UpdateStockDto,
    actor: AuditActor,
  ) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
    });
    if (!article) throw new NotFoundException('Article non trouvé');

    const stockAvant = await this.prisma.stock.findFirst({
      where: { articleId: id, depot: { tenantId } },
    });
    const nouvelleQuantite = Number(data.stock);
    if (!Number.isFinite(nouvelleQuantite) || nouvelleQuantite < 0) {
      throw new BadRequestException('Quantité de stock invalide');
    }
    const quantiteAvant = stockAvant?.quantite ?? 0;
    const difference = nouvelleQuantite - quantiteAvant;

    const result = await this.prisma.stock.updateMany({
      where: { articleId: id, depot: { tenantId } },
      data: { quantite: nouvelleQuantite },
    });
    if (result.count === 0) throw new NotFoundException('Stock introuvable');

    const motif = `Ajustement manuel (${difference >= 0 ? '+' : ''}${difference})`;
    if (stockAvant) {
      await this.prisma.mouvementStock.create({
        data: {
          tenantId,
          articleId: id,
          depotId: stockAvant.depotId,
          type: 'AJUSTEMENT_INVENTAIRE',
          quantite: Math.abs(difference),
          motif,
        },
      });
    }

    await this.auditService
      .logEvent({
        tenantId,
        depotId: stockAvant?.depotId ?? actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.AJUSTEMENT_STOCK,
        severite: AuditSeverite.ATTENTION,
        targetType: 'Stock',
        targetId: id,
        reference: article.designation,
        description: `Ajustement de stock "${article.designation}" : ${quantiteAvant} → ${nouvelleQuantite} (${difference >= 0 ? '+' : ''}${difference})`,
        valeurAvant: { quantite: quantiteAvant },
        valeurApres: { quantite: nouvelleQuantite, difference },
        motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log AJUSTEMENT_STOCK:', err));

    return { success: true, quantite: nouvelleQuantite };
  }

  async deleteArticle(id: string, tenantId: string, actor: AuditActor) {
    const article = await this.prisma.article.findFirst({ where: { id, tenantId } });
    if (!article) throw new NotFoundException('Article non trouvé');
    const deleted = await this.prisma.article.delete({ where: { id, tenantId } });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SUPPRESSION_ARTICLE,
        severite: AuditSeverite.ATTENTION,
        targetType: 'Article',
        targetId: id,
        reference: article.designation,
        description: `Article "${article.designation}" supprimé`,
        valeurAvant: {
          designation: article.designation,
          prixVente: article.prixVente,
          prixAchat: article.prixAchat,
          codeBarres: article.codeBarres,
        },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log SUPPRESSION_ARTICLE:', err));

    return deleted;
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
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.plafondCredit !== undefined) updateData.plafondCredit = parseFloat(data.plafondCredit) || 0;
    if (data.soldeCredit !== undefined) updateData.soldeCredit = parseFloat(data.soldeCredit) || 0;
    if (data.depotId !== undefined) updateData.depotId = data.depotId;

    return this.prisma.client.update({ where: { id, tenantId }, data: updateData });
  }

  async deleteClient(id: string, tenantId: string, actor: AuditActor) {
    const client = await this.prisma.client.findFirst({ where: { id, tenantId } });
    if (!client) throw new NotFoundException('Client non trouvé');
    const deleted = await this.prisma.client.delete({ where: { id, tenantId } });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: client.depotId ?? actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SUPPRESSION_CLIENT,
        severite: AuditSeverite.ATTENTION,
        targetType: 'Client',
        targetId: id,
        reference: client.nom,
        description: `Client "${client.nom}" supprimé`,
        valeurAvant: {
          nom: client.nom,
          telephone: client.telephone,
        },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log SUPPRESSION_CLIENT:', err));

    return deleted;
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
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.depotId !== undefined) updateData.depotId = data.depotId;

    return this.prisma.fournisseur.update({ where: { id, tenantId }, data: updateData });
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

  async createDepense(tenantId: string, data: any, actor: AuditActor) {
    const montant = Number(data.montant);
    const depense = await this.prisma.depense.create({
      data: {
        categorie: data.categorie,
        montant,
        motif: data.motif,
        photoUrl: data.photoUrl,
        depotId: data.depotId,
        tenantId,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.DEPENSE_ENREGISTREE,
        severite: AuditSeverite.INFO,
        targetType: 'Depense',
        targetId: depense.id,
        description: `Dépense enregistrée : ${data.motif || 'sans libellé'} (${montant} FCFA)`,
        valeurApres: { montant, categorie: depense.categorie, motif: data.motif },
        motif: data.motif,
        montant: -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log DEPENSE_ENREGISTREE:', err));

    return depense;
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
        type: data.type,
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
    return this.prisma.promotion.update({
      where: { id, tenantId },
      data: updateData,
    });
  }

  async deletePromotion(id: string, tenantId: string) {
    return this.prisma.promotion.delete({ where: { id, tenantId } });
  }

  // ── Stock ───────────────────────────────────────────────────────────────────

  async findAllStock(tenantId: string, depotId?: string, rayonId?: string) {
    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    if (rayonId)
      where.article = { ...where.article, rayons: { some: { rayonId } } };
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

  async createInventaire(tenantId: string, data: any, actor: AuditActor) {
    const inventaire = await this.prisma.$transaction(async (tx) => {
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
          throw new NotFoundException(
            `Stock introuvable pour article ${ligne.articleId}`,
          );
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

        results.push({
          articleId: ligne.articleId,
          quantiteAvant: existing.quantite,
          quantiteApres: Number(ligne.stockPhysique),
          ecart,
        });
      }
      return results;
    });

    const ecartTotal = inventaire.reduce((sum, l) => sum + l.ecart, 0);
    const nbEcarts = inventaire.filter((l) => l.ecart !== 0).length;

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.INVENTAIRE_REALISE,
        severite: nbEcarts > 0 ? AuditSeverite.ATTENTION : AuditSeverite.INFO,
        targetType: 'Inventaire',
        targetId: null,
        description: `Inventaire réalisé sur ${inventaire.length} article(s), ${nbEcarts} écart(s) constaté(s), écart net ${ecartTotal >= 0 ? '+' : ''}${ecartTotal}`,
        valeurApres: { lignes: inventaire, ecartTotal, nbEcarts },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log INVENTAIRE_REALISE:', err));

    return { success: true, updated: inventaire.length };
  }

  // ── Ventes ──────────────────────────────────────────────────────────────────

  async createVente(tenantId: string, data: any, actor: AuditActor) {
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
    if (!depot)
      throw new BadRequestException('Dépôt introuvable ou non autorisé');

    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });
      if (!client)
        throw new BadRequestException('Client introuvable ou non autorisé');
    }

    // Les vérifications de stock sont maintenant faites dans la transaction

    let validUserId: string | null = null;
    if (actor.userId) {
      const user = await this.prisma.user.findFirst({ where: { id: actor.userId } });
      if (user) validUserId = actor.userId;
    }

    const reference = `VENTE-${Date.now()}`;

    let vente: any;
    try {
      vente = await this.prisma.$transaction(async (tx) => {
        const v = await tx.vente.create({
          data: {
            reference,
            total: Number(data.total),
            statut: 'PAYE',
            modePaiement: data.modePaiement,
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
                total:
                  Number(item.quantite) * Number(item.prix) -
                  (item.remise ? Number(item.remise) : 0),
              })),
            },
          },
          include: { lignes: true, client: true },
        });

        for (const item of data.panier) {
          const articleId = item.articleId;
          const qte = Number(item.quantite);

          const stock = await tx.stock.findFirst({
            where: { articleId, depotId: data.depotId },
          });
          if (!stock) {
            throw new BadRequestException(`Stock introuvable pour l'article ${articleId}`);
          }
          if (stock.quantite < qte) {
            throw new BadRequestException(`Stock insuffisant pour l'article ${articleId}`);
          }

          const decremente = await tx.stock.updateMany({
            where: { articleId, depotId: data.depotId, quantite: { gte: qte } },
            data: { quantite: { decrement: qte } },
          });
          if (decremente.count === 0) {
            // Concurrence : le stock a changé entre la vérification et la
            // décrémentation. Auparavant ce cas passait silencieusement :
            // la vente était créée sans jamais toucher le stock réel.
            throw new ConflictException(
              `Stock modifié entre-temps pour l'article ${articleId}, veuillez réessayer`,
            );
          }

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

        return v;
      });
    } catch (error: any) {
      console.error('=== TRANSACTION ERROR ===', error);
      throw error;
    }

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_CREEE,
        severite: AuditSeverite.INFO,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} créée (${vente.lignes.length} article(s), ${vente.total} FCFA)`,
        valeurApres: {
          total: vente.total,
          modePaiement: vente.modePaiement,
          nbArticles: vente.lignes.length,
        },
        montant: vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log VENTE_CREEE:', err));

    const montantRemise = vente.lignes.reduce(
      (sum: number, l: any) => sum + (l.remise || 0),
      0,
    );
    if (montantRemise > 0) {
      await this.auditService
        .logEvent({
          tenantId,
          depotId: data.depotId,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.REMISE_ACCORDEE,
          severite: AuditSeverite.ATTENTION,
          targetType: 'Vente',
          targetId: vente.id,
          reference: vente.reference,
          description: `Remise accordée sur la vente ${vente.reference} (-${montantRemise} FCFA)`,
          valeurApres: { montantRemise },
          montant: -montantRemise,
          ipAddress: actor.ip,
          userAgent: actor.userAgent,
        })
        .catch((err) => console.error('[Audit] Échec log REMISE_ACCORDEE:', err));
    }

    return vente;
  }

  async annulerVente(id: string, tenantId: string, motif: string | undefined, actor: AuditActor) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    if (vente.statut === 'ANNULE')
      throw new BadRequestException('Cette vente est déjà annulée');

    const motifFinal = motif || 'Annulation manuelle';

    await this.prisma.$transaction(async (tx) => {
      await tx.vente.update({
        where: { id },
        data: { statut: 'ANNULE', motifAnnulation: motifFinal },
      });
      for (const ligne of vente.lignes) {
        await tx.stock.updateMany({
          where: { articleId: ligne.articleId, depotId: vente.depotId },
          data: { quantite: { increment: ligne.quantite } },
        });
      }
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: vente.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_ANNULEE,
        severite: AuditSeverite.CRITIQUE,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} annulée (${vente.total} FCFA) — motif : ${motifFinal}`,
        valeurAvant: { statut: vente.statut, total: vente.total },
        valeurApres: { statut: 'ANNULE', motif: motifFinal },
        motif: motifFinal,
        montant: -vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log VENTE_ANNULEE:', err));

    return { success: true };
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
          return sum + qte * prix;
        }, 0);
      }

      return {
        ...reception,
        montant: total, // Aligné avec 'reception.montant' dans ton frontend
        total: total, // Double sécurité si ton frontend appelle 'reception.total'
      };
    });
  }

  async createReception(tenantId: string, data: any) {
    console.log('=== CREATE RECEPTION DEBUG ===');
    if (!data.depotId) throw new BadRequestException('depotId est requis');
    if (!data.fournisseurId)
      throw new BadRequestException('fournisseurId est requis');
    if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
      throw new BadRequestException(
        'Le tableau de lignes est requis et ne doit pas être vide',
      );
    }

    const depot = await this.prisma.depot.findFirst({
      where: { id: data.depotId, tenantId },
    });
    if (!depot)
      throw new BadRequestException('Dépôt introuvable ou non autorisé');

    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id: data.fournisseurId, tenantId },
    });
    if (!fournisseur)
      throw new BadRequestException('Fournisseur introuvable ou non autorisé');

    // Calcul strict du coût total théorique au niveau du serveur pour figer la valeur financière
    const coutTotalMarchandise = data.lignes.reduce((sum: number, l: any) => {
      const qte = Number(l.quantiteLivree) || 0;
      const prix = Number(l.prixAchatUnitaire) || 0;
      return sum + qte * prix;
    }, 0);

    const paye = data.montantPaye ? Number(data.montantPaye) : 0;
    // La dette est égale au coût total de la marchandise moins ce qui a été payé
    const dette = Math.max(0, coutTotalMarchandise - paye);

    // Initialisation préventive des stocks pour éviter tout crash d'intégrité référentielle
    for (const ligne of data.lignes) {
      const article = await this.prisma.article.findFirst({
        where: { id: ligne.articleId, tenantId },
      });
      if (!article)
        throw new BadRequestException(`Article ${ligne.articleId} introuvable`);

      const stock = await this.prisma.stock.findFirst({
        where: { articleId: ligne.articleId, depotId: data.depotId },
      });

      if (!stock) {
        await this.prisma.stock.create({
          data: {
            articleId: ligne.articleId,
            depotId: data.depotId,
            quantite: 0,
          },
        });
      }
    }

    const reference = `REC-${Date.now()}`;

    try {
      return await this.prisma.receptionFournisseur.create({
        data: {
          reference,
          modePaiement: data.modePaiement ?? 'CASH',
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
    const { statut, fournisseurId, numBordereau, motifAnnulation, lignes } =
      data;

    const reception = await this.prisma.receptionFournisseur.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });

    if (!reception) throw new NotFoundException('Réception non trouvée');

    if ((reception.statut as string) === 'VALIDEE') {
      throw new BadRequestException(
        'Impossible de modifier une réception déjà validée',
      );
    }

    // 1. CAS DE LA VALIDATION EN STOCK
    if (statut === 'VALIDEE' && (reception.statut as string) !== 'VALIDEE') {
      return this.prisma.$transaction(async (tx) => {
        for (const ligne of reception.lignes) {
          const qteTotale = ligne.quantiteLivree;

          const targetStock = await tx.stock.findFirst({
            where: { articleId: ligne.articleId, depotId: reception.depotId },
          });

          await tx.stock.upsert({
            where: { id: targetStock?.id || '' },
            update: { quantite: { increment: qteTotale } },
            create: {
              articleId: ligne.articleId,
              depotId: reception.depotId,
              quantite: qteTotale,
            },
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
          const prix =
            Number(l.prixUnitaire) || Number(l.prixAchatUnitaire) || 0;
          return sum + qte * prix;
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
        if ((reception as any).montantDette !== undefined)
          updateData.montantDette = nouvelleDette;

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
                nouvelleLigne.quantiteLivree = Number(
                  l.qte || l.quantiteLivree || 0,
                );
              } else if ('quantite' in uneLigneExistante) {
                nouvelleLigne.quantite = Number(l.qte || l.quantite || 0);
              } else {
                // Fallback si la table était vide au départ
                nouvelleLigne.quantiteLivree = Number(l.qte || 0);
              }

              // Détection dynamique du champ de prix
              if ('prixAchatUnitaire' in uneLigneExistante) {
                nouvelleLigne.prixAchatUnitaire = Number(
                  l.prixUnitaire || l.prixAchatUnitaire || 0,
                );
              } else if ('prixUnitaire' in uneLigneExistante) {
                nouvelleLigne.prixUnitaire = Number(l.prixUnitaire || 0);
              } else {
                // Fallback si la table était vide au départ
                nouvelleLigne.prixAchatUnitaire = Number(l.prixUnitaire || 0);
              }

              // Optionnel : Gestion de la quantité commandée si le champ existe
              if ('quantiteCommandee' in uneLigneExistante) {
                nouvelleLigne.quantiteCommandee = Number(
                  l.qte || l.quantiteCommandee || 0,
                );
              }

              return nouvelleLigne;
            }),
          };
        }

        // 3. Exécution sécurisée
        return tx.receptionFournisseur.update({
          where: { id },
          data: updateData,
          include: { lignes: true },
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
      throw new BadRequestException(
        'Impossible de supprimer une réception validée',
      );
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
      select: {
        name: true,
        nomEntreprise: true,
        emailPatron: true,
        telephone: true,
      },
    });
    const depots = await this.prisma.depot.findMany({
      where: { tenantId, isArchived: false },
    });
    return {
      infos: {
        nom: tenant?.nomEntreprise ?? tenant?.name,
        email: tenant?.emailPatron,
        telephone: tenant?.telephone,
      },
      depots,
    };
  }

  async updateParametres(tenantId: string, section: string, data: any) {
    if (section === 'infos') {
      return this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          nomEntreprise: data.nom,
          emailPatron: data.email,
          telephone: data.telephone,
        },
      });
    }
    return { success: true };
  }

  // ── Rapports ────────────────────────────────────────────────────────────────

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

  // ── Dépôts ──────────────────────────────────────────────────────────────────

  async findAllDepots(tenantId: string) {
    return this.prisma.depot.findMany({
      where: { tenantId, isArchived: false },
      orderBy: { nom: 'asc' },
    });
  }

  // ── Reset Data ──────────────────────────────────────────────────────────────

  async resetData(tenantId: string, userId: string, confirmation: string) {
    if (confirmation !== 'SUPPRIMER') {
      throw new BadRequestException(
        'Confirmation invalide. Saisissez SUPPRIMER pour continuer.',
      );
    }

    this.logger.warn(
      `Reset data supermarche execute: tenantId=${tenantId}, userId=${userId ?? 'unknown'}, timestamp=${new Date().toISOString()}`,
    );

    await this.prisma.$transaction([
      this.prisma.promotion.deleteMany({ where: { tenantId } }),
      this.prisma.depense.deleteMany({ where: { tenantId } }),
      this.prisma.ligneVente.deleteMany({ where: { vente: { tenantId } } }),
      this.prisma.vente.deleteMany({ where: { tenantId } }),
      this.prisma.receptionFournisseur.deleteMany({ where: { tenantId } }),
      this.prisma.ligneReception.deleteMany({
        where: { reception: { tenantId } },
      }),
      this.prisma.stock.deleteMany({ where: { article: { tenantId } } }),
    ]);
    return { success: true };
  }

  // ── Caisse ───────────────────────────────────────────────
  async getCaisseStatut(tenantId: string, depotId?: string) {
    const where: any = { tenantId, estOuverte: true };
    if (depotId) where.depotId = depotId;
    const session = await this.prisma.sessionCaisse.findFirst({
      where,
      include: { mouvements: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    const mouvements = session?.mouvements || [];
    const entreesJour = mouvements
      .filter((m) => m.type.startsWith('ENCAISSEMENT'))
      .reduce((s, m) => s + m.montant, 0);
    const sortiesJour = mouvements
      .filter((m) => m.type.startsWith('DECAISSEMENT'))
      .reduce((s, m) => s + m.montant, 0);
    return {
      statut: session ? 'OUVERTE' : 'FERMEE',
      solde: session ? session.fondInitial + entreesJour - sortiesJour : 0,
      entreesJour,
      sortiesJour,
      mouvements,
    };
  }

  async ouvrirCaisse(tenantId: string, data: any, actor: AuditActor) {
    requireString(data.depotId, 'depotId');
    requireString(data.userId, 'userId');
    const existing = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (existing) throw new ConflictException('Une caisse est deja ouverte');
    const session = await this.prisma.sessionCaisse.create({
      data: {
        fondInitial: parseFloat(data.montantInitial) || 0,
        depotId: data.depotId,
        userId: data.userId,
        tenantId,
        estOuverte: true,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.CAISSE_OUVERTE,
        severite: AuditSeverite.INFO,
        targetType: 'SessionCaisse',
        targetId: session.id,
        description: `Caisse ouverte avec un fond initial de ${session.fondInitial} FCFA`,
        valeurApres: { fondInitial: session.fondInitial },
        montant: session.fondInitial,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log CAISSE_OUVERTE:', err));

    return session;
  }

  async fermerCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) {
      throw new BadRequestException('Aucune session de caisse ouverte à fermer.');
    }

    const result = await this.prisma.sessionCaisse.updateMany({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
      data: {
        estOuverte: false,
        dateCloture: new Date(),
        fondFinal: data.fondFinal,
        ecart: data.ecart,
      },
    });
    if (result.count === 0) {
      throw new BadRequestException('Aucune session de caisse ouverte à fermer.');
    }

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.CAISSE_FERMEE,
        severite: data.ecart ? AuditSeverite.ATTENTION : AuditSeverite.INFO,
        targetType: 'SessionCaisse',
        targetId: session.id,
        description: `Caisse fermée — fond final ${data.fondFinal ?? 0} FCFA${
          data.ecart ? `, écart de ${data.ecart} FCFA` : ''
        }`,
        valeurAvant: { fondInitial: session.fondInitial, estOuverte: true },
        valeurApres: {
          fondFinal: data.fondFinal ?? null,
          ecart: data.ecart ?? null,
          estOuverte: false,
        },
        montant: data.ecart ?? null,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log CAISSE_FERMEE:', err));

    return result;
  }

  async mouvementCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) throw new BadRequestException('Caisse non ouverte');

    const montant = parseFloat(data.montant);
    const estEntree = data.typeMouvement === 'ENTREE';
    const motif = data.motif || 'Mouvement';

    const mouvement = await this.prisma.mouvementCaisse.create({
      data: {
        type: estEntree ? 'ENCAISSEMENT_VENTE' : 'DECAISSEMENT_DEPENSE',
        montant,
        motif,
        sessionId: session.id,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: estEntree ? AUDIT_ACTIONS.ENTREE_CAISSE : AUDIT_ACTIONS.SORTIE_CAISSE,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementCaisse',
        targetId: mouvement.id,
        description: `${estEntree ? 'Entrée' : 'Sortie'} de caisse de ${montant} FCFA — motif : ${motif}`,
        valeurApres: { montant, motif },
        motif,
        montant: estEntree ? montant : -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log mouvement caisse:', err));

    return mouvement;
  }

  async rapportJournalier(tenantId: string, depotId?: string) {
    return this.getCaisseStatut(tenantId, depotId);
  }
}