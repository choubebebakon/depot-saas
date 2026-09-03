import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditSeverite } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';
import { DepenseCategorieEnum } from './dto/depense.dto';

const MAX_PAGE = 500;
const MAX_LIMIT = 200;
const MAX_AMOUNT = 1_000_000_000;

@Injectable()
export class DepensesProductionService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  private normalizePage(value: unknown): number {
    const page = Number(value ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) throw new BadRequestException(`page doit être un entier compris entre 1 et ${MAX_PAGE}.`);
    return page;
  }

  private normalizeLimit(value: unknown): number {
    const limit = Number(value ?? 50);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new BadRequestException(`limit doit être un entier compris entre 1 et ${MAX_LIMIT}.`);
    return limit;
  }

  private normalizeText(value: unknown, field: string, max = 500): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') throw new BadRequestException(`${field} doit être une chaîne de caractères.`);
    const text = value.trim();
    if (text.length > max) throw new BadRequestException(`${field} ne peut pas dépasser ${max} caractères.`);
    return text || undefined;
  }

  private normalizeAmount(value: unknown): number {
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) throw new BadRequestException(`montant doit être compris entre 0,01 et ${MAX_AMOUNT} FCFA.`);
    return Math.round(amount * 100) / 100;
  }

  private async resolveDepot(tenantId: string, requestedDepotId: string | undefined, actor: AuditActor) {
    if (!tenantId || !actor?.userId) throw new BadRequestException('Contexte utilisateur invalide.');
    const depotId = actor.role === 'PATRON' ? requestedDepotId || actor.depotId : actor.depotId;
    if (!depotId) throw new BadRequestException('Aucun dépôt actif sélectionné.');
    if (actor.role !== 'PATRON' && requestedDepotId && requestedDepotId !== actor.depotId) throw new ConflictException('Accès refusé : ce dépôt ne correspond pas à votre dépôt autorisé.');
    const depot = await this.prisma.depot.findFirst({ where: { id: depotId, tenantId, isArchived: false }, select: { id: true, nom: true } });
    if (!depot) throw new NotFoundException('Dépôt introuvable ou inactif.');
    return depot;
  }

  private audit(payload: Parameters<AuditService['logEvent']>[0]) {
    return this.auditService.logEvent(payload).catch((error) => console.error('[Audit] Échec journalisation dépense:', error));
  }

  async findAll(tenantId: string, params: any, actor: AuditActor) {
    const depot = await this.resolveDepot(tenantId, params?.depotId, actor);
    const page = this.normalizePage(params?.page);
    const limit = this.normalizeLimit(params?.limit);
    const search = this.normalizeText(params?.search, 'search', 120);
    const where: any = { tenantId, depotId: depot.id };
    if (params?.categorie !== undefined) {
      if (!Object.values(DepenseCategorieEnum).includes(params.categorie)) throw new BadRequestException('Catégorie de dépense invalide.');
      where.categorie = params.categorie;
    }
    if (search) where.OR = [{ motif: { contains: search, mode: 'insensitive' } }, { categorie: { contains: search, mode: 'insensitive' } }];
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.depense.findMany({ where, skip, take: limit, include: { depot: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.depense.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string, actor: AuditActor) {
    const row = await this.prisma.depense.findFirst({ where: { id, tenantId }, include: { depot: true } });
    if (!row) throw new NotFoundException('Dépense non trouvée.');
    if (actor.role !== 'PATRON' && row.depotId !== actor.depotId) throw new NotFoundException('Dépense non trouvée.');
    if (!row.depot || row.depot.isArchived) throw new NotFoundException('Dépense non trouvée.');
    return row;
  }

  async create(data: any, tenantId: string, actor: AuditActor, requestedDepotId?: string) {
    const depot = await this.resolveDepot(tenantId, requestedDepotId, actor);
    const montant = this.normalizeAmount(data?.montant);
    const categorie = data?.categorie ?? DepenseCategorieEnum.AUTRE;
    if (!Object.values(DepenseCategorieEnum).includes(categorie)) throw new BadRequestException('Catégorie de dépense invalide.');
    const libelle = this.normalizeText(data?.libelle, 'libelle');
    const motif = this.normalizeText(data?.motif, 'motif') || libelle || 'Dépense sans libellé';
    const row = await this.prisma.depense.create({ data: { tenantId, depotId: depot.id, categorie, montant, motif }, include: { depot: true } });
    await this.audit({ tenantId, depotId: depot.id, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: AUDIT_ACTIONS.DEPENSE_ENREGISTREE, severite: AuditSeverite.INFO, targetType: 'Depense', targetId: row.id, description: `Dépense enregistrée : ${motif} (${montant} FCFA)`, valeurApres: { montant, categorie, motif }, montant: -montant, motif, ipAddress: actor.ip, userAgent: actor.userAgent });
    return row;
  }

  async update(id: string, data: any, tenantId: string, actor: AuditActor) {
    const current = await this.findOne(id, tenantId, actor);
    const updateData: any = {};
    if (data?.montant !== undefined) updateData.montant = this.normalizeAmount(data.montant);
    if (data?.categorie !== undefined) {
      if (!Object.values(DepenseCategorieEnum).includes(data.categorie)) throw new BadRequestException('Catégorie de dépense invalide.');
      updateData.categorie = data.categorie;
    }
    const libelle = this.normalizeText(data?.libelle, 'libelle');
    const motif = this.normalizeText(data?.motif, 'motif');
    if (libelle !== undefined || motif !== undefined) updateData.motif = motif || libelle;
    if (!Object.keys(updateData).length) throw new BadRequestException('Aucune modification fournie.');
    const row = await this.prisma.depense.update({ where: { id: current.id }, data: updateData, include: { depot: true } });
    await this.audit({ tenantId, depotId: current.depotId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: AUDIT_ACTIONS.DEPENSE_MODIFIEE, severite: AuditSeverite.ATTENTION, targetType: 'Depense', targetId: row.id, description: `Dépense ${row.id} modifiée`, valeurAvant: { montant: current.montant, categorie: current.categorie, motif: current.motif }, valeurApres: { montant: row.montant, categorie: row.categorie, motif: row.motif }, ipAddress: actor.ip, userAgent: actor.userAgent });
    return row;
  }

  async delete(id: string, tenantId: string, actor: AuditActor) {
    const current = await this.findOne(id, tenantId, actor);
    const deleted = await this.prisma.depense.delete({ where: { id: current.id } });
    await this.audit({ tenantId, depotId: current.depotId, actorUserId: actor.userId, actorEmail: actor.email, actorRole: actor.role, action: AUDIT_ACTIONS.DEPENSE_SUPPRIMEE, severite: AuditSeverite.CRITIQUE, targetType: 'Depense', targetId: current.id, description: `Dépense ${current.id} supprimée`, valeurAvant: { montant: current.montant, categorie: current.categorie, motif: current.motif }, montant: -current.montant, ipAddress: actor.ip, userAgent: actor.userAgent });
    return deleted;
  }
}
