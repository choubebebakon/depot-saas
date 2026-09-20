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
import { DepotScopeService } from '../../common/depot-scope.service';
import {
  mapUniqueViolation,
  normalizeChannelId,
} from '../../common/customer-channel.util';
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
} from '../../crm/crm-cursor';
import { resolveCrmShopSettings } from '../../crm/crm-settings.service';
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
  adresse?: string;
  email?: string;
  notes?: string;
  depotId?: string;
}

export class UpdateFournisseurDto {
  nom?: string;
  telephone?: string;
  adresse?: string;
  email?: string;
  notes?: string;
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
    private readonly depotScope: DepotScopeService,
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
    const normalized = String(code ?? '').trim();
    if (!normalized) return null;

    // 1) Table multi-codes (CodeBarresArticle) : prioritaire.
    const codeBarre = await this.prisma.codeBarresArticle.findFirst({
      where: { code: normalized, tenantId, actif: true },
      include: { article: true },
    });
    if (codeBarre?.article) return { article: codeBarre.article };

    // 2) Champ unique Article.codeBarres : c'est la cible principale du flux
    // métier (le formulaire article Supermarché écrit sur ce champ, pas sur
    // CodeBarresArticle). Sans ce repli, le scan POS échouait pour ces articles.
    const article = await this.prisma.article.findFirst({
      where: { codeBarres: normalized, tenantId },
    });
    return article ? { article } : null;
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

    if (data.codeBarres) createData.codeBarres = data.codeBarres;
    if (data.familleId) createData.familleId = data.familleId;
    if (data.marqueId) createData.marqueId = data.marqueId;
    if (data.categorieId) createData.categorieId = data.categorieId;
    if (data.unite) createData.unite = data.unite;
    if (data.prixGros !== undefined && data.prixGros !== null && data.prixGros !== '')
      createData.prixGros = Number(data.prixGros);
    if (data.photoUrl) createData.photoUrl = data.photoUrl;
    if (data.datePeremption) {
      const parsed = new Date(data.datePeremption);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Date de péremption invalide.');
      }
      createData.datePeremption = parsed;
    }

    const article = await this.prisma.article.create({ data: createData });

    // Initialisation préventive du stock à zéro pour le dépôt actif (si fourni),
    // afin que l'article soit immédiatement visible dans l'inventaire / le POS.
    if (data.depotId) {
      await this.prisma.stock.upsert({
        where: {
          articleId_depotId: { articleId: article.id, depotId: data.depotId },
        },
        update: {},
        create: {
          articleId: article.id,
          depotId: data.depotId,
          quantite: 0,
        },
      });
    }

    return article;
  }

  async updateArticle(id: string, tenantId: string, data: any) {
    const allowed = [
      'designation',
      'prixVente',
      'prixAchat',
      'seuilCritique',
      'codeBarres',
      'familleId',
      'marqueId',
      'categorieId',
      'unite',
      'prixGros',
      'photoUrl',
      'datePeremption',
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key as string] === undefined) continue;
      if (key === 'datePeremption') {
        if (!data[key as string] || data[key as string] === '') {
          updateData.datePeremption = null;
        } else {
          const parsed = new Date(data[key as string] as string);
          if (Number.isNaN(parsed.getTime())) {
            throw new BadRequestException('Date de péremption invalide.');
          }
          updateData.datePeremption = parsed;
        }
        continue;
      }
      const value = data[key as string];
      if (key === 'prixGros' && (value === '' || value === null)) {
        updateData.prixGros = null;
        continue;
      }
      if (['prixVente', 'prixAchat'].includes(key) && value !== '') {
        updateData[key] = Number(value);
        continue;
      }
      updateData[key] = value;
    }

    return this.prisma.article.update({
      where: { id, tenantId },
      data: updateData,
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
      .catch((err) =>
        console.error('[Audit] Échec log AJUSTEMENT_STOCK:', err),
      );

    return { success: true, quantite: nouvelleQuantite };
  }

  async deleteArticle(id: string, tenantId: string, actor: AuditActor) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
    });
    if (!article) throw new NotFoundException('Article non trouvé');
    const deleted = await this.prisma.article.delete({
      where: { id, tenantId },
    });

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
      .catch((err) =>
        console.error('[Audit] Échec log SUPPRESSION_ARTICLE:', err),
      );

    return deleted;
  }

  // ── Clients ─────────────────────────────────────────────────────────────────

  async findAllClients(
    tenantId: string,
    search?: string,
    limit?: number,
    depotId?: string,
  ) {
    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    // §7 : un commercial ne voit que SON portefeuille de clients.
    if (this.depotScope.isCommercial() && this.depotScope.getUserId())
      where.commercialId = this.depotScope.getUserId();
    if (search && typeof search === 'string' && search.trim() !== '') {
      const needle = search.trim();
      where.OR = [
        { nom: { contains: needle } },
        { telephone: { contains: needle } },
        { email: { contains: needle } },
      ];
    }
    const take = Number(limit) || 50;
    return this.prisma.client.findMany({
      where,
      take: Math.min(take, 100),
      orderBy: { nom: 'asc' },
    });
  }

  async createClient(tenantId: string, data: any) {
    return this.prisma.client
      .create({
        data: {
          nom: data.nom,
          telephone: normalizeChannelId(data.telephone),
          adresse: data.adresse,
          // Canaux CRM : '' ou espaces => NULL (aucun rattachement).
          instagramId: normalizeChannelId(data.instagramId),
          messengerId: normalizeChannelId(data.messengerId),
          depotId: data.depotId,
          // §7 : client créé par un commercial → rattaché à son portefeuille.
          commercialId:
            this.depotScope.isCommercial() && this.depotScope.getUserId()
              ? this.depotScope.getUserId()
              : null,
          tenantId,
        },
      })
      .catch(mapUniqueViolation);
  }

  async updateClient(id: string, tenantId: string, data: any) {
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined)
      updateData.telephone = normalizeChannelId(data.telephone);
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.plafondCredit !== undefined)
      updateData.plafondCredit = parseFloat(data.plafondCredit) || 0;
    if (data.soldeCredit !== undefined)
      updateData.soldeCredit = parseFloat(data.soldeCredit) || 0;
    if (data.depotId !== undefined) updateData.depotId = data.depotId;
    // Canaux CRM : '' efface le rattachement, undefined laisse inchangé.
    if (data.instagramId !== undefined)
      updateData.instagramId = normalizeChannelId(data.instagramId);
    if (data.messengerId !== undefined)
      updateData.messengerId = normalizeChannelId(data.messengerId);

    return this.prisma.client
      .update({
        where: { id, tenantId },
        data: updateData,
      })
      .catch(mapUniqueViolation);
  }

  /**
   * Historique d'achats d'un client, paginé par curseur (keyset).
   *
   * Pourquoi borné : la fiche client d'un supermarché peut porter des milliers
   * de tickets de caisse (contrainte n°7). La page est donc plafonnée et la
   * limite par défaut provient des paramètres du shop
   * (`Tenant.parametres.crm.history.defaultLimit`), jamais d'une constante.
   *
   * Pourquoi un curseur : sur un historique alimenté en continu par la caisse,
   * `skip` re-scannerait toutes les lignes précédentes et pourrait dupliquer ou
   * perdre une ligne si une vente est encaissée entre deux pages. Le curseur
   * fige le dernier couple (date, id) vu — coût constant, aucun doublon.
   */
  async historiqueClient(
    tenantId: string,
    clientId: string,
    query: { limit?: number | string; cursor?: string },
  ) {
    // Le client est vérifié SOUS le tenant : un identifiant appartenant à un
    // autre commerçant renvoie 404 (et non 403), donc n'en révèle même pas
    // l'existence. Aucune donnée inter-tenant ne peut être atteinte.
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client non trouvé');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { parametres: true },
    });
    const settings = resolveCrmShopSettings(tenant?.parametres);

    const requested = Number(query?.limit);
    const limit =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.trunc(requested), settings.history.maxLimit)
        : settings.history.defaultLimit;

    let cursor: { date: string; id: string } | null = null;
    if (query?.cursor) {
      try {
        cursor = decodeHistoryCursor(query.cursor);
      } catch {
        // Le décodeur lève une CrmError : on la traduit en 400 HTTP lisible
        // pour un consommateur back-office (le filtre CRM ne s'applique pas ici).
        throw new BadRequestException('Curseur de pagination invalide.');
      }
    }

    const rows = await this.prisma.vente.findMany({
      where: {
        tenantId,
        clientId,
        ...(cursor
          ? {
              OR: [
                { date: { lt: new Date(cursor.date) } },
                { date: new Date(cursor.date), id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      // +1 ligne : sert uniquement à savoir s'il existe une page suivante.
      take: limit + 1,
      select: {
        id: true,
        reference: true,
        date: true,
        statut: true,
        modePaiement: true,
        total: true,
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => ({
        id: row.id,
        reference: row.reference,
        date: row.date.toISOString(),
        statut: row.statut,
        modePaiement: row.modePaiement,
        // Montant sérialisé en chaîne fixe à 2 décimales : jamais un flottant
        // brut dans la réponse d'un ERP financier.
        total: Number(row.total).toFixed(2),
      })),
      limit,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeHistoryCursor({
              date: last.date.toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  async deleteClient(id: string, tenantId: string, actor: AuditActor) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    const deleted = await this.prisma.client.delete({
      where: { id, tenantId },
    });

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
      .catch((err) =>
        console.error('[Audit] Échec log SUPPRESSION_CLIENT:', err),
      );

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
        adresse: data.adresse,
        email: data.email,
        notes: data.notes,
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

    return this.prisma.fournisseur.update({
      where: { id, tenantId },
      data: updateData,
    });
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
    const motif = data.motif ?? data.libelle ?? data.motif?.trim();
    const depense = await this.prisma.depense.create({
      data: {
        categorie: data.categorie,
        montant,
        motif: String(motif || 'Dépense'),
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
        valeurApres: {
          montant,
          categorie: depense.categorie,
          motif: data.motif,
        },
        motif: data.motif,
        montant: -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) =>
        console.error('[Audit] Échec log DEPENSE_ENREGISTREE:', err),
      );

    return depense;
  }

  async updateDepense(id: string, tenantId: string, data: any) {
    const updateData: any = {};
    if (data.categorie !== undefined) updateData.categorie = data.categorie;
    if (data.montant !== undefined) updateData.montant = Number(data.montant);
    if (data.motif !== undefined) updateData.motif = data.motif;
    else if (data.libelle !== undefined) updateData.motif = data.libelle;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Aucun champ valide à mettre à jour.');
    }
    return this.prisma.depense.update({
      where: { id, tenantId },
      data: updateData,
    });
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
    const articleId = requireString(data.articleId, 'articleId');
    const type = data.type as string;
    if (!['POURCENTAGE', 'MONTANT_FIXE', 'PRIX_FIXE'].includes(type)) {
      throw new BadRequestException('Type de promotion invalide.');
    }
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);
    if (
      Number.isNaN(dateDebut.getTime()) ||
      Number.isNaN(dateFin.getTime())
    ) {
      throw new BadRequestException('Dates de promotion invalides.');
    }
    if (dateFin < dateDebut) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début.',
      );
    }

    const article = await this.prisma.article.findFirst({
      where: { id: articleId, tenantId },
      select: { id: true, prixVente: true },
    });
    if (!article) throw new NotFoundException('Article introuvable.');

    const prixOriginal = Number(article.prixVente) || 0;
    const valeur = Number(data.valeur) ?? 0;
    let prixPromo = Number(data.prixPromo);
    if (!Number.isFinite(prixPromo) || prixPromo <= 0) {
      if (type === 'POURCENTAGE') {
        prixPromo = prixOriginal * (1 - Math.min(100, Math.max(0, valeur)) / 100);
      } else if (type === 'MONTANT_FIXE') {
        prixPromo = Math.max(0, prixOriginal - Math.max(0, valeur));
      } else {
        prixPromo = valeur;
      }
    }
    if (!Number.isFinite(prixPromo) || prixPromo < 0) {
      throw new BadRequestException('Prix promo invalide.');
    }

    return this.prisma.promotion.create({
      data: {
        nom: requireString(data.nom, 'nom'),
        type: type as any,
        valeur,
        prixPromo,
        dateDebut,
        dateFin,
        actif: data.actif ?? true,
        articleId,
        tenantId,
      },
    });
  }

  async updatePromotion(id: string, tenantId: string, data: any) {
    const existing = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: { article: { select: { prixVente: true } } },
    });
    if (!existing) throw new NotFoundException('Promotion introuvable.');

    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.actif !== undefined) updateData.actif = Boolean(data.actif);
    if (data.valeur !== undefined) updateData.valeur = Number(data.valeur);
    if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) updateData.dateFin = new Date(data.dateFin);
    if (data.type !== undefined) {
      if (!['POURCENTAGE', 'MONTANT_FIXE', 'PRIX_FIXE'].includes(data.type)) {
        throw new BadRequestException('Type de promotion invalide.');
      }
      updateData.type = data.type;
    }

    const valeur = Number(updateData.valeur ?? existing.valeur);
    const typeFinal = updateData.type ?? existing.type;
    const prixOriginal = Number(existing.article?.prixVente) || 0;
    let prixPromo = Number(data.prixPromo);
    if (!Number.isFinite(prixPromo) || prixPromo <= 0) {
      if (typeFinal === 'POURCENTAGE') {
        prixPromo = prixOriginal * (1 - Math.min(100, Math.max(0, valeur)) / 100);
      } else if (typeFinal === 'MONTANT_FIXE') {
        prixPromo = Math.max(0, prixOriginal - Math.max(0, valeur));
      } else {
        prixPromo = valeur;
      }
    }
    if (Number.isFinite(prixPromo)) updateData.prixPromo = prixPromo;

    if (updateData.dateDebut && updateData.dateFin && updateData.dateFin < updateData.dateDebut) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début.',
      );
    }

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
      .catch((err) =>
        console.error('[Audit] Échec log INVENTAIRE_REALISE:', err),
      );

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
      const user = await this.prisma.user.findFirst({
        where: { id: actor.userId },
      });
      if (user) validUserId = actor.userId;
    }

    const reference = `VENTE-${Date.now()}`;

    let vente: any;
    try {
      vente = await this.prisma.$transaction(async (tx) => {
        // ── Multi-caisse ────────────────────────────────────────
        // Chaque vente est rattachée au poste de caisse qui l'encaisse
        // (CAISSE_1 par défaut). Une session doit être ouverte sur ce
        // poste : impossible d'encaisser sur une caisse fermée.
        const posteId =
          String(data.posteId ?? '').trim().toUpperCase() || 'CAISSE_1';
        const session = await tx.sessionCaisse.findFirst({
          where: {
            tenantId,
            depotId: data.depotId,
            posteId,
            estOuverte: true,
          },
        });
        if (!session) {
          throw new BadRequestException(
            `Aucune caisse ouverte sur le poste ${posteId} de ce dépôt. Ouvrez la caisse avant d'encaisser.`,
          );
        }

        const cashEncaisse =
          data.modePaiement === 'CASH' ? Number(data.total) : 0;

        const v = await tx.vente.create({
          data: {
            reference,
            total: Number(data.total),
            statut: 'PAYE',
            modePaiement: data.modePaiement,
            montantCash:
              data.modePaiement === 'CASH' ? Number(data.total) : 0,
            montantOM:
              data.modePaiement === 'ORANGE_MONEY' ? Number(data.total) : 0,
            montantMoMo:
              data.modePaiement === 'MTN_MOMO' ? Number(data.total) : 0,
            montantCredit:
              data.modePaiement === 'CREDIT' ? Number(data.total) : 0,
            // Ticket de caisse : montant effectivement reçu et monnaie rendue.
            montantRecu: Number(data.montantRecu ?? 0),
            monnaie: Number(data.monnaie ?? 0),
            tenantId,
            depotId: data.depotId,
            clientId: data.clientId,
            createurId: validUserId,
            sessionId: session.id,
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

        // Encaissement immédiat du cash dans la caisse du poste : le solde
        // disponible (dépenses, fermeture) reflète la vente en temps réel,
        // sans attendre la réconciliation de clôture.
        if (cashEncaisse > 0) {
          await tx.mouvementCaisse.create({
            data: {
              type: 'ENCAISSEMENT_VENTE',
              montant: cashEncaisse,
              motif: `Vente ${reference} (poste ${posteId})`,
              reference: v.id,
              sessionId: session.id,
            },
          });
        }

        for (const item of data.panier) {
          const articleId = item.articleId;
          const qte = Number(item.quantite);

          const stock = await tx.stock.findFirst({
            where: { articleId, depotId: data.depotId },
          });
          if (!stock) {
            throw new BadRequestException(
              `Stock introuvable pour l'article ${articleId}`,
            );
          }
          if (stock.quantite < qte) {
            throw new BadRequestException(
              `Stock insuffisant pour l'article ${articleId}`,
            );
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
        .catch((err) =>
          console.error('[Audit] Échec log REMISE_ACCORDEE:', err),
        );
    }

    return vente;
  }

  async annulerVente(
    id: string,
    tenantId: string,
    motif: string | undefined,
    actor: AuditActor,
  ) {
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

  // ── Mouvements de stock : contrat de base (implémenté par l'override
  // production — ProductionSupermarcheStockService, fourni via useExisting). ──

  entreeStock(_tenantId: string, _data: any, _actor: AuditActor) {
    throw new Error(
      'entreeStock doit être implémenté par ProductionSupermarcheStockService.',
    );
  }

  sortieStock(_tenantId: string, _data: any, _actor: AuditActor) {
    throw new Error(
      'sortieStock doit être implémenté par ProductionSupermarcheStockService.',
    );
  }

  transfertStock(_tenantId: string, _data: any, _actor: AuditActor) {
    throw new Error(
      'transfertStock doit être implémenté par ProductionSupermarcheStockService.',
    );
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
    const [complets, depots] = await Promise.all([
      this.getParametresComplets(tenantId),
      this.prisma.depot.findMany({ where: { tenantId, isArchived: false } }),
    ]);
    return { ...complets, depots };
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
    // Sections persistées dans le JSON `parametres` du tenant :
    // ticket, caisse, facture (merge non destructif).
    if (['ticket', 'caisse', 'facture'].includes(section)) {
      const current = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { parametres: true },
      });
      const merge = { ...((current?.parametres ?? {}) as any) };
      merge[section] = { ...(merge[section] || {}), ...data };
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { parametres: merge },
      });
      return merge[section];
    }
    return { success: true };
  }

  // ── Rapports ────────────────────────────────────────────────────────────────

  async getRapports(
    tenantId: string,
    periode?: string,
    dateDebut?: string,
    dateFin?: string,
    depotId?: string,
  ) {
    const end = dateFin ? new Date(dateFin) : new Date();
    const start = dateDebut
      ? new Date(dateDebut)
      : periode === 'mois'
        ? new Date(end.getFullYear(), end.getMonth(), 1)
        : periode === 'annee'
          ? new Date(end.getFullYear(), 0, 1)
          : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const whereVentes: any = {
      tenantId,
      date: { gte: start, lte: end },
      statut: 'PAYE' as any,
    };
    if (depotId) whereVentes.depotId = depotId;
    const whereDepenses: any = { tenantId, createdAt: { gte: start, lte: end } };
    if (depotId) whereDepenses.depotId = depotId;

    const [ventes, depenses, totalVentes, totalDepenses, rayons] =
      await Promise.all([
        this.prisma.vente.findMany({
          where: whereVentes,
          include: {
            lignes: {
              include: { article: { include: { rayons: true } } },
            },
            client: true,
          },
          orderBy: { date: 'desc' },
        }),
        this.prisma.depense.findMany({
          where: whereDepenses,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.vente.aggregate({
          where: whereVentes,
          _sum: { total: true },
        }),
        this.prisma.depense.aggregate({
          where: whereDepenses,
          _sum: { montant: true },
        }),
        this.prisma.rayon.findMany({
          where: { tenantId },
          select: { id: true, nom: true, couleur: true },
        }),
      ]);

    // Ventes par rayon (calcul en mémoire, temps réel)
    const rayonsMap = new Map<
      string,
      { id: string; nom: string; couleur: string | null; montant: number }
    >();
    for (const rayon of rayons) {
      rayonsMap.set(rayon.id, { ...rayon, montant: 0 });
    }
    const topMap = new Map<
      string,
      { articleId: string; nom: string; qte: number; ca: number }
    >();
    for (const vente of ventes) {
      for (const ligne of vente.lignes || []) {
        const qte = Number(ligne.quantite) || 0;
        const ca = Number(ligne.total ?? qte * (ligne.prix || 0)) || 0;
        const rayonId = ligne.article?.rayons?.[0]?.rayonId;
        if (rayonId && rayonsMap.has(rayonId)) {
          rayonsMap.get(rayonId)!.montant += ca;
        }
        const entry = topMap.get(ligne.articleId) || {
          articleId: ligne.articleId,
          nom: ligne.article?.designation || `Article ${ligne.articleId}`,
          qte: 0,
          ca: 0,
        };
        entry.qte += qte;
        entry.ca += ca;
        topMap.set(ligne.articleId, entry);
      }
    }

    const chiffreAffaires = totalVentes._sum.total ?? 0;
    const totalDep = totalDepenses._sum.montant ?? 0;
    const topProduits = Array.from(topMap.values())
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 10);

    const topArticles = topProduits.map((p) => ({
      articleId: p.articleId,
      nom: p.nom,
      _sum: { quantite: p.qte, total: p.ca },
    }));

    return {
      periode: { debut: start, fin: end },
      chiffreAffaires,
      totalDepenses: totalDep,
      benefice: chiffreAffaires - totalDep,
      ventes,
      depensesDetails: depenses,
      topArticles,
      // Contrat attendu par le frontend (RapportsPage + DashboardSupermarche)
      caTotal: chiffreAffaires,
      transactions: ventes.length,
      depensesTotal: totalDep,
      depenses: totalDep,
      marge: chiffreAffaires - totalDep,
      rayons: Array.from(rayonsMap.values()).map((r) => ({
        id: r.id,
        nom: r.nom,
        montant: r.montant,
        couleur: r.couleur || undefined,
      })),
      topProduits,
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

  async getSessionCaisse(tenantId: string, depotId?: string) {
    const where: any = { tenantId, estOuverte: true };
    if (depotId) where.depotId = depotId;
    return this.prisma.sessionCaisse.findFirst({
      where,
      include: {
        mouvements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  async getResumeCaisse(tenantId: string, depotId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereVentes: any = {
      tenantId,
      date: { gte: today },
      statut: 'PAYE' as any,
    };
    if (depotId) whereVentes.depotId = depotId;

    const whereDepenses: any = { tenantId, createdAt: { gte: today } };
    if (depotId) whereDepenses.depotId = depotId;

    const [ventesJour, depensesJour, sessionActive] = await Promise.all([
      this.prisma.vente.aggregate({
        where: whereVentes,
        _sum: {
          montantCash: true,
          montantOM: true,
          montantMoMo: true,
          montantCredit: true,
          total: true,
        },
        _count: { _all: true },
      }),
      this.prisma.depense.aggregate({
        where: whereDepenses,
        _sum: { montant: true },
        _count: { _all: true },
      }),
      this.getSessionCaisse(tenantId, depotId),
    ]);

    return {
      ventesTotal: ventesJour._sum?.total || 0,
      ventesCash: ventesJour._sum?.montantCash || 0,
      ventesOM: ventesJour._sum?.montantOM || 0,
      ventesMoMo: ventesJour._sum?.montantMoMo || 0,
      ventesCredit: ventesJour._sum?.montantCredit || 0,
      nbVentes: ventesJour._count?._all || 0,
      depensesTotal: depensesJour._sum?.montant || 0,
      nbDepenses: depensesJour._count?._all || 0,
      soldeNet:
        (ventesJour._sum?.montantCash || 0) -
        (depensesJour._sum?.montant || 0),
      sessionActive: !!sessionActive,
      sessionId: sessionActive?.id || null,
      fondInitial: sessionActive?.fondInitial || 0,
    };
  }

  async ouvrirCaisse(tenantId: string, data: any, actor: AuditActor) {
    requireString(data.depotId, 'depotId');
    const userId = data.userId || actor?.userId || '';
    requireString(userId, 'userId');
    const fondInitial = Number(data.fondInitial ?? data.montantInitial ?? 0);
    if (!Number.isFinite(fondInitial) || fondInitial < 0) {
      throw new BadRequestException('Fond initial invalide.');
    }
    const existing = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (existing) throw new ConflictException('Une caisse est deja ouverte');
    const session = await this.prisma.sessionCaisse.create({
      data: {
        fondInitial,
        depotId: data.depotId,
        userId,
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
      throw new BadRequestException(
        'Aucune session de caisse ouverte à fermer.',
      );
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
      throw new BadRequestException(
        'Aucune session de caisse ouverte à fermer.',
      );
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
        action: estEntree
          ? AUDIT_ACTIONS.ENTREE_CAISSE
          : AUDIT_ACTIONS.SORTIE_CAISSE,
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
      .catch((err) =>
        console.error('[Audit] Échec log mouvement caisse:', err),
      );

    return mouvement;
  }

  async rapportJournalier(tenantId: string, depotId?: string) {
    return this.getCaisseStatut(tenantId, depotId);
  }

  // ── Ventes / Factures ──────────────────────────────────────────────────
  async findAllVentes(tenantId: string, limit?: number, depotId?: string) {
    const take = Math.min(Number(limit) || 100, 200);
    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    // §7 : un commercial ne voit que SES ventes (createurId).
    if (this.depotScope.isCommercial() && this.depotScope.getUserId())
      where.createurId = this.depotScope.getUserId();
    return this.prisma.vente.findMany({
      where,
      include: {
        lignes: { include: { article: true } },
        client: true,
        createur: true,
      },
      orderBy: { date: 'desc' },
      take,
    });
  }

  async findVenteById(id: string, tenantId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: true } },
        client: true,
        createur: true,
      },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée.');
    return vente;
  }

  // ── Mouvements de stock ────────────────────────────────────────────────
  async getStockHistory(articleId: string, tenantId: string, depotId?: string) {
    const where: any = { articleId, tenantId };
    if (depotId) where.depotId = depotId;
    return this.prisma.mouvementStock.findMany({
      where,
      include: {
        article: { select: { id: true, designation: true, codeBarres: true } },
        depot: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getMouvementsStock(
    tenantId: string,
    depotId?: string,
    articleId?: string,
    limit?: number,
  ) {
    const where: any = { tenantId };
    if (depotId) where.depotId = depotId;
    if (articleId) where.articleId = articleId;
    return this.prisma.mouvementStock.findMany({
      where,
      include: {
        article: { select: { id: true, designation: true, codeBarres: true } },
        depot: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 100, 300),
    });
  }

  // ── Paramètres complets (infos / ticket / caisse / facture) ────────────
  async getParametresComplets(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        nomEntreprise: true,
        name: true,
        emailPatron: true,
        telephone: true,
        adresse: true,
        slogan: true,
        messageFin: true,
        logo: true,
        parametres: true,
      },
    });

    const raw = (tenant?.parametres ?? {}) as any;
    return {
      infos: {
        nom: tenant?.nomEntreprise ?? tenant?.name ?? '',
        nomEntreprise: tenant?.nomEntreprise ?? tenant?.name ?? '',
        email: tenant?.emailPatron ?? '',
        telephone: tenant?.telephone ?? '',
        adresse: tenant?.adresse ?? '',
        slogan: tenant?.slogan ?? '',
        devise: raw?.infos?.devise ?? 'FCFA',
      },
      ticket: {
        messageAccueil: raw?.ticket?.messageAccueil ?? '',
        messageFin:
          tenant?.messageFin ?? raw?.ticket?.messageFin ?? '',
        afficherLogo: raw?.ticket?.afficherLogo ?? true,
      },
      caisse: {
        alerteStockFaible: raw?.caisse?.alerteStockFaible ?? 5,
        autoImpression: raw?.caisse?.autoImpression ?? false,
        nomCaissiere: raw?.caisse?.nomCaissiere ?? '',
      },
      facture: {
        piedDePage: raw?.facture?.piedDePage ?? '',
        afficherLogo: raw?.facture?.afficherLogo ?? true,
        afficherModePaiement: raw?.facture?.afficherModePaiement ?? true,
      },
      tenant: {
        nomEntreprise: tenant?.nomEntreprise ?? tenant?.name ?? '',
        adresse: tenant?.adresse ?? '',
        telephone: tenant?.telephone ?? '',
        emailPatron: tenant?.emailPatron ?? '',
        logo: tenant?.logo ?? null,
      },
    };
  }

  async updateParametresComplets(tenantId: string, body: any) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { parametres: true },
    });
    const merge = { ...((current?.parametres ?? {}) as any) };
    for (const section of ['infos', 'ticket', 'caisse', 'facture'] as const) {
      if (body?.[section] && typeof body[section] === 'object') {
        merge[section] = { ...(merge[section] || {}), ...body[section] };
      }
    }

    const data: any = { parametres: merge };
    if (body?.ticket?.messageFin !== undefined) {
      data.messageFin = String(body.ticket.messageFin);
    }
    if (body?.infos) {
      if (body.infos.nomEntreprise)
        data.nomEntreprise = String(body.infos.nomEntreprise);
      if (body.infos.email) data.emailPatron = String(body.infos.email);
      if (body.infos.telephone) data.telephone = String(body.infos.telephone);
      if (body.infos.adresse !== undefined)
        data.adresse = String(body.infos.adresse);
      if (body.infos.slogan !== undefined)
        data.slogan = String(body.infos.slogan);
    }

    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }
}
