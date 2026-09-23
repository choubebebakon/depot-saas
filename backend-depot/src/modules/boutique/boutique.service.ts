import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AuditSeverite } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CATEGORIES_PAR_TYPE } from '../../../prisma/seeds/categoriesBoutique';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';
import { DepotScopeService } from '../../common/depot-scope.service';
import {
  mapUniqueViolation,
  normalizeChannelId,
} from '../../common/customer-channel.util';

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

function parseOptionalDate(
  value: unknown,
  field = 'datePeremption',
): Date | null {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(
      `${field} invalide. Utilisez une date ISO 8601.`,
    );
  }
  return date;
}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}
  async create(data: any, tenantId: string) {
    requireString(data.articleId, 'articleId');
    requireString(data.nom, 'nom');
    if (!data.dateDebut || !data.dateFin)
      throw new BadRequestException('Les dates de promotion sont requises');
    const valeur = parseFloat(data.valeur);
    if (!Number.isFinite(valeur) || valeur < 0)
      throw new BadRequestException('valeur invalide');
    return this.prisma.promotion.create({
      data: {
        tenantId,
        articleId: data.articleId,
        nom: data.nom.trim(),
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
    const row = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: { article: true },
    });
    if (!row) throw new NotFoundException('Promotion non trouvée');
    return row;
  }
  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.valeur !== undefined) updateData.valeur = parseFloat(data.valeur);
    if (data.prixPromo !== undefined)
      updateData.prixPromo = parseFloat(data.prixPromo);
    if (data.dateDebut !== undefined)
      updateData.dateDebut = new Date(data.dateDebut);
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

@Injectable()
export class CreditClientService {
  constructor(private prisma: PrismaService) {}
  async payerDette(tenantId: string, clientId: string, data: any) {
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    const result = await this.prisma.client.updateMany({
      where: { id: clientId, tenantId },
      data: { soldeCredit: { decrement: montant } },
    });
    if (!result.count) throw new NotFoundException('Client introuvable');
    return this.prisma.detteClient.create({
      data: {
        montant,
        montantPaye: montant,
        statut: 'SOLDEE',
        clientId,
        tenantId,
        depotId: data.depotId,
      },
    });
  }
  async getDettesClient(tenantId: string, clientId: string) {
    return this.prisma.detteClient.findMany({
      where: { clientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}
  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1);
    const limit = toPositiveInt(params?.limit, 50);
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params?.search)
      where.OR = [
        { designation: { contains: params.search, mode: 'insensitive' } },
        { codeBarres: { contains: params.search, mode: 'insensitive' } },
      ];
    if (params?.categorieId) where.categorieId = params.categorieId;
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
    const row = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { famille: true, marque: true, categorie: true },
    });
    if (!row) throw new NotFoundException('Article non trouvé');
    return row;
  }
  /** Résout une famille saisie en TEXTE LIBRE : find-or-create par nom (tenant). */
  private async resolveFamille(
    tenantId: string,
    familleNom?: string,
    familleId?: string | null,
  ): Promise<string | null> {
    const nom = (familleNom || '').trim();
    if (!nom) return familleId || null;
    const existing = await this.prisma.famille.findFirst({
      where: { tenantId, nom: { equals: nom, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.famille.create({
      data: { tenantId, nom },
    });
    return created.id;
  }

  async create(data: any, tenantId: string) {
    requireString(data.designation, 'designation');
    requireString(data.depotId, 'depotId');
    const prixVente = parseFloat(data.prixVente);
    if (!Number.isFinite(prixVente) || prixVente < 0)
      throw new BadRequestException('prixVente invalide');
    const familleId = await this.resolveFamille(
      tenantId,
      data.familleNom,
      data.familleId,
    );
    const article = await this.prisma.article.create({
      data: {
        tenantId,
        designation: data.designation.trim(),
        prixVente,
        prixAchat: parseFloat(data.prixAchat) || 0,
        seuilCritique: parseInt(data.seuilCritique) || 0,
        codeBarres: data.codeBarres || null,
        unite: data.unite || 'PIECE',
        familleId,
        marqueId: data.marqueId || null,
        categorieId: data.categorieId || null,
        photoUrl: data.photoUrl || null,
        prixGros:
          data.prixGros === undefined || data.prixGros === null || data.prixGros === ''
            ? null
            : parseFloat(data.prixGros),
        datePeremption: parseOptionalDate(data.datePeremption),
      },
      include: { famille: true, marque: true, categorie: true },
    });
    await this.prisma.stock.upsert({
      where: {
        articleId_depotId: { articleId: article.id, depotId: data.depotId },
      },
      update: {},
      create: { articleId: article.id, depotId: data.depotId, quantite: 0 },
    });
    return article;
  }
  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.designation !== undefined)
      updateData.designation = requireString(data.designation, 'designation');
    if (data.prixVente !== undefined) {
      const n = parseFloat(data.prixVente);
      if (!Number.isFinite(n) || n < 0)
        throw new BadRequestException('prixVente invalide');
      updateData.prixVente = n;
    }
    if (data.prixAchat !== undefined)
      updateData.prixAchat = parseFloat(data.prixAchat) || 0;
    if (data.seuilCritique !== undefined)
      updateData.seuilCritique = parseInt(data.seuilCritique) || 0;
    if (data.codeBarres !== undefined)
      updateData.codeBarres = data.codeBarres || null;
    if (data.unite !== undefined) updateData.unite = data.unite;
    if (data.familleId !== undefined)
      updateData.familleId = data.familleId || null;
    if (data.familleNom !== undefined)
      updateData.familleId = await this.resolveFamille(
        tenantId,
        data.familleNom,
        data.familleId,
      );
    if (data.marqueId !== undefined)
      updateData.marqueId = data.marqueId || null;
    if (data.categorieId !== undefined)
      updateData.categorieId = data.categorieId || null;
    if (data.photoUrl !== undefined)
      updateData.photoUrl = data.photoUrl || null;
    if (data.datePeremption !== undefined)
      updateData.datePeremption = parseOptionalDate(data.datePeremption);
    if (data.prixGros !== undefined)
      updateData.prixGros =
        data.prixGros === null || data.prixGros === ''
          ? null
          : parseFloat(data.prixGros);
    return this.prisma.article.update({
      where: { id },
      data: updateData,
      include: { famille: true, marque: true, categorie: true },
    });
  }
  async delete(id: string, tenantId: string, actor: AuditActor) {
    const article = await this.findOne(id, tenantId);
    const deleted = await this.prisma.article.delete({ where: { id } });
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
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async findAll(tenantId: string, depotId?: string | null, params?: any) {
    const page = toPositiveInt(params?.page, 1),
      limit = toPositiveInt(params?.limit, 50),
      skip = (page - 1) * limit;
    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    if (params?.search)
      where.article = {
        ...where.article,
        designation: { contains: params.search, mode: 'insensitive' },
      };
    if (params?.categorieId)
      where.article = { ...where.article, categorieId: params.categorieId };
    const [data, total] = await Promise.all([
      this.prisma.stock.findMany({
        where,
        skip,
        take: limit,
        include: {
          article: {
            include: { famille: true, marque: true, categorie: true },
          },
          depot: true,
        },
        orderBy: { quantite: 'asc' },
      }),
      this.prisma.stock.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getStockHistory(tenantId: string, articleId: string, query: any = {}) {
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, 50), 200);
    const where = { articleId, tenantId };
    const [total, data] = await Promise.all([
      this.prisma.mouvementStock.count({ where }),
      this.prisma.mouvementStock.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data, total, page, limit };
  }

  async entreStock(tenantId: string, data: any, actor: AuditActor) {
    const { articleId, quantite, depotId } = data;
    requireString(articleId, 'articleId');
    requireString(depotId, 'depotId');
    const qty = toPositiveInt(quantite, 0);
    if (!qty) throw new BadRequestException('quantite doit etre superieure a 0');

    const avant = await this.prisma.stock.findFirst({
      where: { articleId, depotId },
    });
    await this.prisma.stock.upsert({
      where: { articleId_depotId: { articleId, depotId } },
      update: { quantite: { increment: qty } },
      create: { articleId, depotId, quantite: qty },
    });
    const motif = data.motif || 'Entrée manuelle';
    const mouvement = await this.prisma.mouvementStock.create({
      data: {
        type: 'ENTREE',
        quantite: qty,
        articleId,
        depotId,
        tenantId,
        motif,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.ENTREE_STOCK,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementStock',
        targetId: mouvement.id,
        description: `Entrée de stock de ${qty} unité(s) — motif : ${motif}`,
        valeurAvant: { quantite: avant?.quantite ?? 0 },
        valeurApres: { quantite: (avant?.quantite ?? 0) + qty },
        motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log ENTREE_STOCK:', err));

    return mouvement;
  }

  async sortieStock(tenantId: string, data: any, actor: AuditActor) {
    const { articleId, quantite, depotId } = data;
    requireString(articleId, 'articleId');
    requireString(depotId, 'depotId');
    const qty = toPositiveInt(quantite, 0);
    if (!qty) throw new BadRequestException('quantite doit etre superieure a 0');

    const avant = await this.prisma.stock.findFirst({
      where: { articleId, depotId },
    });
    const updated = await this.prisma.stock.updateMany({
      where: { articleId, depotId, quantite: { gte: qty } },
      data: { quantite: { decrement: qty } },
    });
    if (!updated.count) throw new BadRequestException('Stock insuffisant');
    const motif = data.motif || 'Sortie manuelle';
    const mouvement = await this.prisma.mouvementStock.create({
      data: {
        type: 'SORTIE',
        quantite: qty,
        articleId,
        depotId,
        tenantId,
        motif,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SORTIE_STOCK,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementStock',
        targetId: mouvement.id,
        description: `Sortie de stock de ${qty} unité(s) — motif : ${motif}`,
        valeurAvant: { quantite: avant?.quantite ?? 0 },
        valeurApres: { quantite: (avant?.quantite ?? 0) - qty },
        motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log SORTIE_STOCK:', err));

    return mouvement;
  }

  async transfertStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = data.articleId;
    const sourceDepotId = data.sourceDepotId || data.depotId;
    const destDepotId = data.depotDestination;
    requireString(articleId, 'articleId');
    requireString(sourceDepotId, 'sourceDepotId');
    requireString(destDepotId, 'depotDestination');
    const qty = toPositiveInt(data.quantite, 0);
    if (!qty) throw new BadRequestException('quantite doit etre superieure a 0');
    if (sourceDepotId === destDepotId) {
      throw new BadRequestException(
        'Le dépôt source et le dépôt destination doivent être différents',
      );
    }

    const transfert = await this.prisma.$transaction(async (tx) => {
      const t = await tx.transfertStock.create({
        data: {
          reference: `TRF-${Date.now()}`,
          statut: 'TERMINE',
          sourceDepotId,
          destDepotId,
          motif: data.motif,
          tenantId,
          lignes: {
            create: { articleId, quantite: qty },
          },
        },
      });

      const decremente = await tx.stock.updateMany({
        where: { articleId, depotId: sourceDepotId, quantite: { gte: qty } },
        data: { quantite: { decrement: qty } },
      });
      if (!decremente.count)
        throw new BadRequestException('Stock insuffisant sur le dépôt source');

      await tx.stock.upsert({
        where: { articleId_depotId: { articleId, depotId: destDepotId } },
        update: { quantite: { increment: qty } },
        create: { articleId, depotId: destDepotId, quantite: qty },
      });

      await tx.mouvementStock.create({
        data: {
          type: 'TRANSFERT_SORTIE',
          quantite: qty,
          articleId,
          depotId: sourceDepotId,
          tenantId,
          motif: `Transfert vers ${destDepotId}`,
        },
      });
      await tx.mouvementStock.create({
        data: {
          type: 'TRANSFERT_ENTREE',
          quantite: qty,
          articleId,
          depotId: destDepotId,
          tenantId,
          motif: `Transfert depuis ${sourceDepotId}`,
        },
      });

      return t;
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: sourceDepotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.TRANSFERT_VALIDE,
        severite: AuditSeverite.INFO,
        targetType: 'TransfertStock',
        targetId: transfert.id,
        description: `Transfert de ${qty} unité(s) de ${sourceDepotId} vers ${destDepotId}`,
        valeurAvant: { sourceDepotId, destDepotId, quantite: qty },
        valeurApres: { statut: 'TERMINE' },
        motif: data.motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log TRANSFERT_VALIDE:', err));

    return transfert;
  }
}

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    // §7 : périmètre individuel du commercial (« mes clients »).
    private readonly depotScope: DepotScopeService,
  ) {}
  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1),
      limit = toPositiveInt(params?.limit, 50),
      skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params?.depotId) where.depotId = params.depotId;
    // §7 : un commercial ne voit que SON portefeuille de clients.
    if (this.depotScope.isCommercial() && this.depotScope.getUserId())
      where.commercialId = this.depotScope.getUserId();
    if (params?.search)
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { telephone: { contains: params.search } },
      ];
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
    const where: any = { id, tenantId };
    // §7 : un commercial n'accède qu'à SON portefeuille de clients.
    if (this.depotScope.isCommercial() && this.depotScope.getUserId())
      where.commercialId = this.depotScope.getUserId();
    const row = await this.prisma.client.findFirst({ where });
    if (!row) throw new NotFoundException('Client non trouvé');
    return row;
  }
  async create(data: any, tenantId: string) {
    requireString(data.nom, 'nom');
    return this.prisma.client
      .create({
        data: {
          tenantId,
          nom: data.nom.trim(),
          telephone: normalizeChannelId(data.telephone),
          adresse: data.adresse || null,
          // Canaux CRM : '' ou espaces => NULL (aucun rattachement). Le
          // nettoyage est partagé avec le module Clients générique.
          instagramId: normalizeChannelId(data.instagramId),
          messengerId: normalizeChannelId(data.messengerId),
          depotId: data.depotId || null,
          plafondCredit: parseFloat(data.plafondCredit) || 0,
          soldeCredit: parseFloat(data.soldeCredit) || 0,
          // §7 : un client créé par un commercial lui est rattaché.
          ...(this.depotScope.isCommercial() && this.depotScope.getUserId()
            ? { commercialId: this.depotScope.getUserId() as string }
            : {}),
        },
      })
      .catch(mapUniqueViolation);
  }
  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = requireString(data.nom, 'nom');
    if (data.telephone !== undefined)
      updateData.telephone = normalizeChannelId(data.telephone);
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.depotId !== undefined) updateData.depotId = data.depotId || null;
    if (data.plafondCredit !== undefined)
      updateData.plafondCredit = parseFloat(data.plafondCredit) || 0;
    // Canaux CRM : '' efface le rattachement, undefined laisse inchangé.
    if (data.instagramId !== undefined)
      updateData.instagramId = normalizeChannelId(data.instagramId);
    if (data.messengerId !== undefined)
      updateData.messengerId = normalizeChannelId(data.messengerId);
    return this.prisma.client
      .update({ where: { id }, data: updateData })
      .catch(mapUniqueViolation);
  }
  async delete(id: string, tenantId: string, actor: AuditActor) {
    const row = await this.findOne(id, tenantId);
    const deleted = await this.prisma.client.delete({ where: { id } });
    await this.auditService
      .logEvent({
        tenantId,
        depotId: row.depotId ?? actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SUPPRESSION_CLIENT,
        severite: AuditSeverite.ATTENTION,
        targetType: 'Client',
        targetId: id,
        reference: row.nom,
        description: `Client "${row.nom}" supprimé`,
        valeurAvant: {
          nom: row.nom,
          telephone: row.telephone,
          soldeCredit: row.soldeCredit,
        },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) =>
        console.error('[Audit] Échec log SUPPRESSION_CLIENT:', err),
      );
    return deleted;
  }
}

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1),
      limit = toPositiveInt(params?.limit, 50),
      skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params?.depotId) where.depotId = params.depotId;
    if (params?.search)
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { telephone: { contains: params.search } },
      ];
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
    const row = await this.prisma.fournisseur.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Fournisseur non trouvé');
    return row;
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
    if (data.nom !== undefined) updateData.nom = requireString(data.nom, 'nom');
    if (data.telephone !== undefined)
      updateData.telephone = data.telephone || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.depotId !== undefined) updateData.depotId = data.depotId || null;
    return this.prisma.fournisseur.update({ where: { id }, data: updateData });
  }
  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.fournisseur.delete({ where: { id } });
  }
}

@Injectable()
export class DepensesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}
  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1),
      limit = toPositiveInt(params?.limit, 50),
      skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params?.depotId) where.depotId = params.depotId;
    if (params?.categorie) where.categorie = params.categorie;
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
    const row = await this.prisma.depense.findFirst({
      where: { id, tenantId },
      include: { depot: true },
    });
    if (!row) throw new NotFoundException('Dépense non trouvée');
    return row;
  }
  async create(data: any, tenantId: string, actor: AuditActor) {
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    requireString(data.depotId, 'depotId');
    const motif = data.libelle || data.motif || '';
    const row = await this.prisma.depense.create({
      data: {
        tenantId,
        depotId: data.depotId,
        categorie: data.categorie || 'AUTRE',
        montant,
        motif,
      },
      include: { depot: true },
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
        targetId: row.id,
        description: `Dépense enregistrée : ${motif || 'sans libellé'} (${montant} FCFA)`,
        valeurApres: { montant, categorie: row.categorie, motif },
        motif,
        montant: -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) =>
        console.error('[Audit] Échec log DEPENSE_ENREGISTREE:', err),
      );
    return row;
  }
  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.montant !== undefined)
      updateData.montant = parseFloat(data.montant);
    if (data.categorie !== undefined) updateData.categorie = data.categorie;
    if (data.libelle !== undefined || data.motif !== undefined)
      updateData.motif = data.libelle || data.motif || '';
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

@Injectable()
export class VentesService {
  protected readonly db: PrismaService;
  protected readonly audit: AuditService;

  constructor(
    prisma: PrismaService,
    auditService: AuditService,
    // §7 : périmètre individuel du commercial (« mes ventes »).
    protected readonly depotScope?: DepotScopeService,
  ) {
    this.db = prisma;
    this.audit = auditService;
  }

  async createVente(tenantId: string, data: any, actor: AuditActor) {
    requireString(data.depotId, 'depotId');
    if (!Array.isArray(data.panier) || !data.panier.length)
      throw new BadRequestException('Le panier est vide ou invalide');
    const sousTotal = data.panier.reduce((sum: number, item: any) => {
      const prix = parseFloat(item.prix) || 0;
      const qte = parseInt(item.quantite) || 0;
      const remise = parseFloat(item.remise) || 0;
      return sum + prix * qte * (1 - remise / 100);
    }, 0);
    const remiseGlobale = parseFloat(data.remiseGlobale) || 0;
    const total = sousTotal * (1 - remiseGlobale / 100);
    if (!Number.isFinite(total) || total <= 0)
      throw new BadRequestException('Total de vente invalide');
    const totalNet = Math.round(total * 100) / 100;

    // Ticket 80mm : montant reçu / monnaie restituée — calculés côté serveur,
    // le client ne fournit que le montant présenté (CASH) ou rien (mobile).
    const estCash = (data.modePaiement || 'CASH') === 'CASH';
    const montantRecuBrut = Number(data.montantRecu);
    const montantRecu =
      Number.isFinite(montantRecuBrut) && estCash && montantRecuBrut > 0
        ? montantRecuBrut
        : totalNet;
    if (estCash && montantRecu < totalNet)
      throw new BadRequestException(
        'Le montant reçu est inférieur au total de la vente.',
      );
    const monnaie = Math.max(
      0,
      Number((montantRecu - totalNet).toFixed(2)),
    );

    const reference = `VENTE-${Date.now()}`;
    const vente = await this.db.$transaction(async (tx) => {
      const v = await tx.vente.create({
        data: {
          reference,
          total: Math.round(total * 100) / 100,
          statut: 'PAYE',
          modePaiement: data.modePaiement || 'CASH',
          // Ticket de caisse 80mm : montant reçu et monnaie restituée.
          montantRecu,
          monnaie,
          // Ventilation exigée par la contrainte Vente_payment_total_consistent
          // (total = cash + OM + MoMo + crédit) — sinon création en échec 500.
          montantCash: estCash ? totalNet : 0,
          montantOM: (data.modePaiement || 'CASH') === 'ORANGE_MONEY' ? totalNet : 0,
          montantMoMo: (data.modePaiement || 'CASH') === 'MTN_MOMO' ? totalNet : 0,
          montantCredit: (data.modePaiement || 'CASH') === 'CREDIT' ? totalNet : 0,
          tenantId,
          depotId: data.depotId,
          clientId: data.clientId || null,
          createurId: actor.userId || null,
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
          createur: { select: { id: true, nom: true, email: true } },
        },
      });
      for (const item of data.panier) {
        const qte = parseInt(item.quantite);
        const stock = await tx.stock.findFirst({
          where: { articleId: item.articleId, depotId: data.depotId },
        });
        if (!stock || stock.quantite < qte)
          throw new BadRequestException(
            `Stock insuffisant pour l'article ${item.articleId}`,
          );
        const changed = await tx.stock.updateMany({
          where: {
            articleId: item.articleId,
            depotId: data.depotId,
            quantite: { gte: qte },
          },
          data: { quantite: { decrement: qte } },
        });
        if (!changed.count)
          throw new ConflictException(
            `Stock modifié entre-temps pour l'article ${item.articleId}`,
          );
        await tx.mouvementStock.create({
          data: {
            type: 'SORTIE_VENTE',
            quantite: qte,
            articleId: item.articleId,
            depotId: data.depotId,
            tenantId,
            motif: `Vente ${reference}`,
          },
        });
      }
      return v;
    });
    await this.audit
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
        description: `Vente ${vente.reference} créée`,
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
    return vente;
  }
  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1),
      limit = toPositiveInt(params?.limit, 50),
      skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params?.statut) where.statut = params.statut;
    if (params?.clientId) where.clientId = params.clientId;
    if (params?.depotId) where.depotId = params.depotId;
    // §7 : un commercial ne voit que SES ventes (createurId).
    if (this.depotScope?.isCommercial() && this.depotScope?.getUserId())
      where.createurId = this.depotScope.getUserId();
    const [data, total] = await Promise.all([
      this.db.vente.findMany({
        where,
        skip,
        take: limit,
        include: {
          lignes: { include: { article: { select: { designation: true } } } },
          client: { select: { nom: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.db.vente.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async findOne(id: string, tenantId: string) {
    const row = await this.db.vente.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: { select: { designation: true } } } },
        client: true,
        createur: { select: { id: true, nom: true, email: true } },
      },
    });
    if (!row) throw new NotFoundException('Vente non trouvée');
    return row;
  }
  async annulerVente(
    id: string,
    tenantId: string,
    motif: string | undefined,
    actor: AuditActor,
  ) {
    const vente = await this.db.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });
    if (!vente) throw new NotFoundException('Vente non trouvée');
    if (vente.statut === 'ANNULE')
      throw new BadRequestException('Cette vente est déjà annulée');
    const motifFinal = motif || 'Annulation manuelle';
    await this.db.$transaction(async (tx) => {
      await tx.vente.update({
        where: { id },
        data: { statut: 'ANNULE', motifAnnulation: motifFinal },
      });
      for (const ligne of vente.lignes)
        await tx.stock.updateMany({
          where: { articleId: ligne.articleId, depotId: vente.depotId },
          data: { quantite: { increment: ligne.quantite } },
        });
    });
    await this.audit
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
        description: `Vente ${vente.reference} annulée`,
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
    const [ventes, depenses, totalVentes, totalDepenses, topArticlesRaw] =
      await Promise.all([
        this.db.vente.findMany({
          where: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          include: { lignes: { include: { article: true } } },
          orderBy: { date: 'desc' },
        }),
        this.db.depense.findMany({
          where: { tenantId, createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: 'desc' },
        }),
        this.db.vente.aggregate({
          where: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          _sum: { total: true },
        }),
        this.db.depense.aggregate({
          where: { tenantId, createdAt: { gte: start, lte: end } },
          _sum: { montant: true },
        }),
        this.db.ligneVente.groupBy({
          by: ['articleId'],
          where: {
            vente: { tenantId, date: { gte: start, lte: end }, statut: 'PAYE' },
          },
          _sum: { quantite: true, total: true },
          orderBy: { _sum: { quantite: 'desc' } },
          take: 10,
        }),
      ]);

    // Enrichir topArticles avec les désignations d'articles (comme supermarche)
    // NB : sur le modèle Prisma `Article`, le libellé est `designation` ; l'API
    // expose volontairement la clé `nom` consommée par le frontend (p.nom).
    const articleIds = topArticlesRaw.map((l) => l.articleId);
    const articles = await this.db.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, designation: true },
    });
    const articleNameMap = new Map(
      articles.map((a) => [a.id, a.designation]),
    );

    const topArticles = topArticlesRaw.map((l) => ({
      articleId: l.articleId,
      nom: articleNameMap.get(l.articleId) || 'Inconnu',
      _sum: { quantite: l._sum.quantite || 0, total: l._sum.total || 0 },
    }));
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
  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [ventesJour, caJour, clientsActifs, stockCritique, totalProduits] =
      await this.db.$transaction([
        this.db.vente.count({
          where: { tenantId, date: { gte: today }, statut: 'PAYE' },
        }),
        this.db.vente.aggregate({
          where: { tenantId, date: { gte: today }, statut: 'PAYE' },
          _sum: { total: true },
        }),
        this.db.client.count({ where: { tenantId } }),
        this.db.stock.count({
          where: {
            article: { tenantId },
            OR: [
              { quantite: { lte: 0 } },
              {
                AND: [
                  { quantite: { gt: 0 } },
                  { article: { seuilCritique: { gt: 0 } } },
                ],
              },
            ],
          },
        }),
        this.db.article.count({ where: { tenantId } }),
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

  async findAllCategories(tenantId: string, query?: any) {
    return this.db.categorie.findMany({
      where: { tenantId },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
      include: { _count: { select: { articles: true } } },
    });
  }
  async findOneCategorie(tenantId: string, id: string) {
    const cat = await this.db.categorie.findFirst({
      where: { id, tenantId },
      include: { articles: true },
    });
    if (!cat) throw new NotFoundException(`Catégorie ${id} introuvable`);
    return cat;
  }
  async createCategorie(tenantId: string, dto: any) {
    const nom = requireString(dto.nom, 'nom');
    const existing = await this.db.categorie.findFirst({
      where: { tenantId, nom: { equals: nom, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(
        `Une catégorie nommée « ${nom} » existe déjà.`,
      );
    return this.db.categorie.create({
      data: {
        tenantId,
        nom,
        description: dto.description?.trim() || null,
        couleur: dto.couleur || '#6366f1',
        icone: dto.icone?.trim() || '🏷️',
        actif: dto.actif !== undefined ? Boolean(dto.actif) : true,
        ordre: Number.isFinite(Number(dto.ordre)) ? Number(dto.ordre) : 0,
      },
      include: { _count: { select: { articles: true } } },
    });
  }
  async updateCategorie(tenantId: string, id: string, dto: any) {
    await this.findOneCategorie(tenantId, id);
    const data: any = {};
    if (dto.nom !== undefined) {
      const nom = requireString(dto.nom, 'nom');
      const duplicate = await this.db.categorie.findFirst({
        where: {
          tenantId,
          nom: { equals: nom, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ConflictException(
          `Une catégorie nommée « ${nom} » existe déjà.`,
        );
      data.nom = nom;
    }
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.couleur !== undefined) data.couleur = dto.couleur || null;
    if (dto.icone !== undefined) data.icone = dto.icone?.trim() || null;
    if (dto.actif !== undefined) data.actif = Boolean(dto.actif);
    if (dto.ordre !== undefined) {
      const n = Number(dto.ordre);
      if (!Number.isInteger(n) || n < 0)
        throw new BadRequestException(
          "L'ordre doit être un entier positif ou nul.",
        );
      data.ordre = n;
    }
    return this.db.categorie.update({
      where: { id },
      data,
      include: { _count: { select: { articles: true } } },
    });
  }
  async deleteCategorie(tenantId: string, id: string) {
    await this.findOneCategorie(tenantId, id);
    const count = await this.db.article.count({
      where: { categorieId: id, tenantId },
    });
    if (count > 0)
      throw new BadRequestException(
        `Impossible de supprimer : ${count} article(s) utilisent cette catégorie`,
      );
    return this.db.categorie.delete({ where: { id } });
  }
  async seedCategoriesByType(tenantId: string, typeBoutique: string) {
    const normalized = typeBoutique.trim().toLowerCase();
    const cats =
      CATEGORIES_PAR_TYPE[normalized] ?? CATEGORIES_PAR_TYPE.generique;
    if (!cats)
      throw new BadRequestException(
        `Type de boutique invalide : ${typeBoutique}`,
      );
    const result = await this.db.$transaction(async (tx) => {
      let created = 0;
      let skipped = 0;
      for (const [index, cat] of cats.entries()) {
        const exists = await tx.categorie.findFirst({
          where: { tenantId, nom: { equals: cat.nom, mode: 'insensitive' } },
          select: { id: true },
        });
        if (exists) {
          skipped++;
          continue;
        }
        await tx.categorie.create({ data: { ...cat, tenantId, ordre: index } });
        created++;
      }
      return { created, skipped, type: normalized };
    });
    return result;
  }

  async getCaisseStatut(tenantId: string, depotId?: string) {
    const where: any = { tenantId, estOuverte: true };
    if (depotId) where.depotId = depotId;
    const session = await this.db.sessionCaisse.findFirst({
      where,
      include: { mouvements: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    const mouvements = session?.mouvements || [];
    const entreesJour = mouvements
      .filter((m: any) => m.type.startsWith('ENCAISSEMENT'))
      .reduce((s: number, m: any) => s + m.montant, 0);
    const sortiesJour = mouvements
      .filter((m: any) => m.type.startsWith('DECAISSEMENT'))
      .reduce((s: number, m: any) => s + m.montant, 0);
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
    const existing = await this.db.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (existing) throw new ConflictException('Une caisse est deja ouverte');
    const session = await this.db.sessionCaisse.create({
      data: {
        fondInitial: parseFloat(data.montantInitial) || 0,
        depotId: data.depotId,
        userId: data.userId,
        tenantId,
        estOuverte: true,
      },
    });
    return session;
  }
  async fermerCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.db.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session)
      throw new BadRequestException(
        'Aucune session de caisse ouverte à fermer.',
      );
    const result = await this.db.sessionCaisse.updateMany({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
      data: {
        estOuverte: false,
        dateCloture: new Date(),
        fondFinal: data.fondFinal,
        ecart: data.ecart,
      },
    });
    if (!result.count)
      throw new BadRequestException(
        'Aucune session de caisse ouverte à fermer.',
      );
    return result;
  }
  async mouvementCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.db.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) throw new BadRequestException('Caisse non ouverte');
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    return this.db.mouvementCaisse.create({
      data: {
        type:
          data.typeMouvement === 'ENTREE'
            ? 'ENCAISSEMENT_VENTE'
            : 'DECAISSEMENT_DEPENSE',
        montant,
        motif: data.motif || 'Mouvement',
        sessionId: session.id,
      },
    });
  }
  async rapportJournalier(tenantId: string, depotId?: string) {
    return this.getCaisseStatut(tenantId, depotId);
  }
}

@Injectable()
export class ReceptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
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

  async findOne(id: string, tenantId: string) {
    const reception = await this.prisma.receptionFournisseur.findFirst({
      where: { id, tenantId },
      include: {
        fournisseur: true,
        depot: true,
        lignes: { include: { article: true } },
      },
    });
    if (!reception) throw new NotFoundException('Réception non trouvée');
    return reception;
  }

  async create(tenantId: string, data: any) {
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

    const coutTotalMarchandise = data.lignes.reduce((sum: number, l: any) => {
      const qte = Number(l.quantiteLivree) || 0;
      const prix = Number(l.prixAchatUnitaire) || 0;
      return sum + qte * prix;
    }, 0);

    const paye = data.montantPaye ? Number(data.montantPaye) : 0;
    const dette = Math.max(0, coutTotalMarchandise - paye);

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

    return this.prisma.receptionFournisseur.create({
      data: {
        reference,
        modePaiement: data.modePaiement ?? 'CASH',
        montantPaye: paye,
        montantDette: dette,
        numBordereau: data.numBordereau,
        fournisseurId: data.fournisseurId,
        depotId: data.depotId,
        tenantId,
        lignes: {
          create: data.lignes.map((l: any) => ({
            articleId: l.articleId,
            quantiteLivree: Number(l.quantiteLivree),
            quantiteCommandee: Number(l.quantiteCommandee) || Number(l.quantiteLivree),
            prixAchatUnitaire: Number(l.prixAchatUnitaire),
          })),
        },
      },
      include: { lignes: true },
    });
  }

  async update(tenantId: string, id: string, data: any) {
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

    const montantPaye = (reception as any).montantPaye || 0;
    let coutTotalMarchandise = 0;

    if (Array.isArray(lignes)) {
      coutTotalMarchandise = lignes.reduce((sum: number, l: any) => {
        const qte = Number(l.qte) || Number(l.quantiteLivree) || 0;
        const prix = Number(l.prixUnitaire) || Number(l.prixAchatUnitaire) || 0;
        return sum + qte * prix;
      }, 0);
    }
    const nouvelleDette = Math.max(0, coutTotalMarchandise - montantPaye);

    return this.prisma.$transaction(async (tx) => {
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

      if (lignes && Array.isArray(lignes)) {
        const uneLigneExistante = reception.lignes[0] || {};

        updateData.lignes = {
          create: lignes.map((l: any) => {
            const nouvelleLigne: any = {
              articleId: l.articleId,
            };

            if ('quantiteLivree' in uneLigneExistante) {
              nouvelleLigne.quantiteLivree = Number(
                l.qte || l.quantiteLivree || 0,
              );
            } else if ('quantite' in uneLigneExistante) {
              nouvelleLigne.quantite = Number(l.qte || l.quantite || 0);
            } else {
              nouvelleLigne.quantiteLivree = Number(l.qte || 0);
            }

            if ('prixAchatUnitaire' in uneLigneExistante) {
              nouvelleLigne.prixAchatUnitaire = Number(
                l.prixUnitaire || l.prixAchatUnitaire || 0,
              );
            } else if ('prixUnitaire' in uneLigneExistante) {
              nouvelleLigne.prixUnitaire = Number(l.prixUnitaire || 0);
            } else {
              nouvelleLigne.prixAchatUnitaire = Number(l.prixUnitaire || 0);
            }

            if ('quantiteCommandee' in uneLigneExistante) {
              nouvelleLigne.quantiteCommandee = Number(
                l.qte || l.quantiteCommandee || 0,
              );
            }

            return nouvelleLigne;
          }),
        };
      }

      return tx.receptionFournisseur.update({
        where: { id },
        data: updateData,
        include: { lignes: true },
      });
    });
  }

  async remove(tenantId: string, id: string) {
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
  }
}
