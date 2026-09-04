import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditSeverite, PromotionType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';

const MAX_VALUE = 1_000_000_000;
const MAX_NAME = 160;

@Injectable()
export class PromotionsProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${field} est requis.`);
    const v = value.trim();
    if (v.length > MAX_NAME) throw new BadRequestException(`${field} ne peut pas dépasser ${MAX_NAME} caractères.`);
    return v;
  }

  private amount(value: unknown, field: string, allowZero = false): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0) || n > MAX_VALUE) {
      throw new BadRequestException(`${field} est invalide.`);
    }
    return Math.round(n * 100) / 100;
  }

  private date(value: unknown, field: string): Date {
    const d = new Date(String(value));
    if (!value || Number.isNaN(d.getTime())) throw new BadRequestException(`${field} est invalide.`);
    return d;
  }

  private type(value: unknown): PromotionType {
    if (!value) return PromotionType.POURCENTAGE;
    if (!Object.values(PromotionType).includes(value as PromotionType)) {
      throw new BadRequestException('Type de promotion invalide.');
    }
    return value as PromotionType;
  }

  private async assertArticle(tenantId: string, depotId: string, articleId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, tenantId, stocks: { some: { depotId } } },
      select: { id: true, designation: true, prixVente: true },
    });
    if (!article) throw new NotFoundException('Article introuvable dans le dépôt actif.');
    return article;
  }

  private async assertPromotion(tenantId: string, depotId: string, id: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: { article: { select: { id: true, designation: true, prixVente: true } } },
    });
    if (!promotion) throw new NotFoundException('Promotion introuvable.');
    await this.assertArticle(tenantId, depotId, promotion.articleId);
    return promotion;
  }

  private validateBusiness(type: PromotionType, valeur: number, prixPromo: number, prixVente: number) {
    if (type === PromotionType.POURCENTAGE && valeur > 100) {
      throw new BadRequestException('Une remise en pourcentage ne peut pas dépasser 100 %.');
    }
    if (type === PromotionType.MONTANT_FIXE && valeur > prixVente) {
      throw new BadRequestException('La remise fixe ne peut pas dépasser le prix de vente.');
    }
    if (type === PromotionType.PRIX_FIXE && (prixPromo <= 0 || prixPromo > prixVente)) {
      throw new BadRequestException('Le prix promotionnel doit être supérieur à 0 et inférieur ou égal au prix de vente.');
    }
  }

  private async assertNoOverlap(tenantId: string, articleId: string, start: Date, end: Date, exceptId?: string) {
    const overlap = await this.prisma.promotion.findFirst({
      where: {
        tenantId,
        articleId,
        actif: true,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
        dateDebut: { lt: end },
        dateFin: { gt: start },
      },
      select: { id: true, nom: true },
    });
    if (overlap) throw new ConflictException(`Une promotion active chevauche déjà cette période pour cet article : ${overlap.nom}.`);
  }

  private audit(payload: Parameters<AuditService['logEvent']>[0]) {
    return this.auditService.logEvent(payload).catch((error) => {
      console.error('[Audit] Échec journalisation promotion:', error);
    });
  }

  async findAll(tenantId: string, depotId: string) {
    if (!depotId) throw new BadRequestException('Dépôt actif requis.');
    const rows = await this.prisma.promotion.findMany({
      where: { tenantId, article: { stocks: { some: { depotId } } } },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows;
  }

  async findOne(id: string, tenantId: string, depotId: string) {
    return this.assertPromotion(tenantId, depotId, id);
  }

  async create(data: any, tenantId: string, depotId: string, actor: AuditActor) {
    const articleId = this.text(data?.articleId, 'articleId');
    const article = await this.assertArticle(tenantId, depotId, articleId);
    const nom = this.text(data?.nom ?? data?.libelle, 'nom');
    const type = this.type(data?.type);
    const valeur = this.amount(data?.valeur, 'valeur', true);
    const prixPromo = this.amount(data?.prixPromo ?? (type === PromotionType.PRIX_FIXE ? data?.valeur : article.prixVente), 'prixPromo', true);
    const dateDebut = this.date(data?.dateDebut, 'dateDebut');
    const dateFin = this.date(data?.dateFin, 'dateFin');
    if (dateFin <= dateDebut) throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    this.validateBusiness(type, valeur, prixPromo, article.prixVente);
    await this.assertNoOverlap(tenantId, articleId, dateDebut, dateFin);

    const row = await this.prisma.promotion.create({
      data: { tenantId, articleId, nom, type, valeur, prixPromo, dateDebut, dateFin, actif: data?.actif !== false },
      include: { article: true },
    });
    await this.audit({
      tenantId, depotId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role,
      action: AUDIT_ACTIONS.PROMOTION_CREEE, severite: AuditSeverite.INFO,
      targetType: 'Promotion', targetId: row.id, reference: row.nom,
      description: `Promotion "${row.nom}" créée pour ${article.designation}`,
      valeurApres: { articleId, type, valeur, prixPromo, dateDebut, dateFin },
      ipAddress: actor.ip, userAgent: actor.userAgent,
    });
    return row;
  }

  async update(id: string, data: any, tenantId: string, depotId: string, actor: AuditActor) {
    const current = await this.assertPromotion(tenantId, depotId, id);
    const articleId = data?.articleId ? this.text(data.articleId, 'articleId') : current.articleId;
    const article = await this.assertArticle(tenantId, depotId, articleId);
    const type = data?.type !== undefined ? this.type(data.type) : current.type;
    const valeur = data?.valeur !== undefined ? this.amount(data.valeur, 'valeur', true) : current.valeur;
    const prixPromo = data?.prixPromo !== undefined ? this.amount(data.prixPromo, 'prixPromo', true) : current.prixPromo;
    const dateDebut = data?.dateDebut !== undefined ? this.date(data.dateDebut, 'dateDebut') : current.dateDebut;
    const dateFin = data?.dateFin !== undefined ? this.date(data.dateFin, 'dateFin') : current.dateFin;
    if (dateFin <= dateDebut) throw new BadRequestException('La date de fin doit être postérieure au début.');
    this.validateBusiness(type, valeur, prixPromo, article.prixVente);
    if (current.actif || data?.actif === true) await this.assertNoOverlap(tenantId, articleId, dateDebut, dateFin, id);

    const updateData: any = { articleId, type, valeur, prixPromo, dateDebut, dateFin };
    if (data?.nom !== undefined || data?.libelle !== undefined) updateData.nom = this.text(data.nom ?? data.libelle, 'nom');
    if (data?.actif !== undefined) updateData.actif = Boolean(data.actif);

    const row = await this.prisma.promotion.update({ where: { id }, data: updateData, include: { article: true } });
    await this.audit({
      tenantId, depotId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role,
      action: AUDIT_ACTIONS.PROMOTION_MODIFIEE, severite: AuditSeverite.ATTENTION,
      targetType: 'Promotion', targetId: row.id, reference: row.nom,
      description: `Promotion "${row.nom}" modifiée`,
      valeurAvant: { type: current.type, valeur: current.valeur, prixPromo: current.prixPromo, dateDebut: current.dateDebut, dateFin: current.dateFin, actif: current.actif },
      valeurApres: { type: row.type, valeur: row.valeur, prixPromo: row.prixPromo, dateDebut: row.dateDebut, dateFin: row.dateFin, actif: row.actif },
      ipAddress: actor.ip, userAgent: actor.userAgent,
    });
    return row;
  }

  async delete(id: string, tenantId: string, depotId: string, actor: AuditActor) {
    const current = await this.assertPromotion(tenantId, depotId, id);
    const row = await this.prisma.promotion.delete({ where: { id } });
    await this.audit({
      tenantId, depotId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role,
      action: AUDIT_ACTIONS.PROMOTION_SUPPRIMEE, severite: AuditSeverite.CRITIQUE,
      targetType: 'Promotion', targetId: row.id, reference: row.nom,
      description: `Promotion "${row.nom}" supprimée`,
      valeurAvant: { type: current.type, valeur: current.valeur, prixPromo: current.prixPromo, dateDebut: current.dateDebut, dateFin: current.dateFin, actif: current.actif },
      ipAddress: actor.ip, userAgent: actor.userAgent,
    });
    return row;
  }
}
