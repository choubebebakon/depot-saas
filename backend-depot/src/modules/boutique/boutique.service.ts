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

function parseOptionalDate(value: unknown, field = 'datePeremption'): Date | null {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} invalide. Utilisez une date ISO 8601.`);
  }
  return date;
}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, tenantId: string) {
    requireString(data.articleId, 'articleId');
    requireString(data.nom, 'nom');
    if (!data.dateDebut) throw new BadRequestException('dateDebut est requis');
    if (!data.dateFin) throw new BadRequestException('dateFin est requis');
    const valeur = parseFloat(data.valeur);
    if (!Number.isFinite(valeur) || valeur < 0) throw new BadRequestException('valeur invalide');
    return this.prisma.promotion.create({
      data: {
        tenantId, articleId: data.articleId, nom: data.nom, type: data.type || 'POURCENTAGE', valeur,
        prixPromo: parseFloat(data.prixPromo) || 0,
        dateDebut: new Date(data.dateDebut), dateFin: new Date(data.dateFin),
        actif: data.actif !== undefined ? Boolean(data.actif) : true,
      }, include: { article: true },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.promotion.findMany({ where: { tenantId }, include: { article: true }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, tenantId: string) {
    const promotion = await this.prisma.promotion.findFirst({ where: { id, tenantId }, include: { article: true } });
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
    return this.prisma.promotion.update({ where: { id }, data: updateData, include: { article: true } });
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
    if (!Number.isFinite(montant) || montant <= 0) throw new BadRequestException('montant invalide');
    const result = await this.prisma.client.updateMany({ where: { id: clientId, tenantId }, data: { soldeCredit: { decrement: montant } } });
    if (result.count === 0) throw new NotFoundException('Client introuvable');
    return this.prisma.detteClient.create({ data: { montant, montantPaye: montant, statut: 'SOLDEE', clientId, tenantId, depotId: data.depotId } });
  }
  async getDettesClient(tenantId: string, clientId: string) {
    return this.prisma.detteClient.findMany({ where: { clientId, tenantId }, orderBy: { createdAt: 'desc' } });
  }
}

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async findAll(tenantId: string, params?: any) {
    const page = toPositiveInt(params?.page, 1), limit = toPositiveInt(params?.limit, 50), search = params?.search;
    const categorieId = params?.categorieId, skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (search) where.OR = [{ designation: { contains: search, mode: 'insensitive' } }, { codeBarres: { contains: search, mode: 'insensitive' } }];
    if (categorieId && categorieId !== '') where.categorieId = categorieId;
    const [data, total] = await Promise.all([
      this.prisma.article.findMany({ where, skip, take: limit, include: { famille: true, marque: true, categorie: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.article.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({ where: { id, tenantId }, include: { famille: true, marque: true, categorie: true } });
    if (!article) throw new NotFoundException('Article non trouvé');
    return article;
  }

  async create(data: any, tenantId: string) {
    requireString(data.designation, 'designation');
    requireString(data.depotId, 'depotId');
    const prixVente = parseFloat(data.prixVente);
    if (!Number.isFinite(prixVente) || prixVente < 0) throw new BadRequestException('prixVente invalide');
    const datePeremption = parseOptionalDate(data.datePeremption);
    const article = await this.prisma.article.create({
      data: {
        tenantId, designation: data.designation.trim(), prixVente,
        prixAchat: parseFloat(data.prixAchat) || 0, seuilCritique: parseInt(data.seuilCritique) || 0,
        codeBarres: data.codeBarres || null, unite: data.unite || 'PIECE',
        familleId: data.familleId || null, marqueId: data.marqueId || null, categorieId: data.categorieId || null,
        photoUrl: data.photoUrl || null, datePeremption,
      }, include: { famille: true, marque: true, categorie: true },
    });
    await this.prisma.stock.upsert({ where: { articleId_depotId: { articleId: article.id, depotId: data.depotId } }, update: {}, create: { articleId: article.id, depotId: data.depotId, quantite: 0 } });
    return article;
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.designation !== undefined) updateData.designation = requireString(data.designation, 'designation');
    if (data.prixVente !== undefined) { const n = parseFloat(data.prixVente); if (!Number.isFinite(n) || n < 0) throw new BadRequestException('prixVente invalide'); updateData.prixVente = n; }
    if (data.prixAchat !== undefined) updateData.prixAchat = parseFloat(data.prixAchat) || 0;
    if (data.seuilCritique !== undefined) updateData.seuilCritique = parseInt(data.seuilCritique) || 0;
    if (data.codeBarres !== undefined) updateData.codeBarres = data.codeBarres || null;
    if (data.unite !== undefined) updateData.unite = data.unite;
    if (data.familleId !== undefined) updateData.familleId = data.familleId || null;
    if (data.marqueId !== undefined) updateData.marqueId = data.marqueId || null;
    if (data.categorieId !== undefined) updateData.categorieId = data.categorieId || null;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;
    if (data.datePeremption !== undefined) updateData.datePeremption = parseOptionalDate(data.datePeremption);
    return this.prisma.article.update({ where: { id }, data: updateData, include: { famille: true, marque: true, categorie: true } });
  }

  async delete(id: string, tenantId: string, actor: AuditActor) {
    const article = await this.findOne(id, tenantId);
    const deleted = await this.prisma.article.delete({ where: { id } });
    await this.auditService.logEvent({ tenantId, depotId: actor.depotId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: AUDIT_ACTIONS.SUPPRESSION_ARTICLE, severite: AuditSeverite.ATTENTION, targetType: 'Article', targetId: id, reference: article.designation, description: `Article "${article.designation}" supprimé`, valeurAvant: { designation: article.designation, prixVente: article.prixVente, prixAchat: article.prixAchat, codeBarres: article.codeBarres }, ipAddress: actor.ip, userAgent: actor.userAgent }).catch((err) => console.error('[Audit] Échec log SUPPRESSION_ARTICLE:', err));
    return deleted;
  }
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, depotId?: string | null, params?: any) {
    const page = toPositiveInt(params?.page, 1), limit = toPositiveInt(params?.limit, 50), search = params?.search, categorieId = params?.categorieId, skip = (page - 1) * limit;
    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    if (search) where.article = { ...where.article, designation: { contains: search, mode: 'insensitive' } };
    if (categorieId && categorieId !== '') where.article = { ...where.article, categorieId };
    const [data, total] = await Promise.all([
      this.prisma.stock.findMany({ where, skip, take: limit, include: { article: { include: { famille: true, marque: true, categorie: true } }, depot: true }, orderBy: { quantite: 'asc' } }),
      this.prisma.stock.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}

// The remaining services are intentionally kept unchanged in this phase.
