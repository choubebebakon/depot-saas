import { createHash, randomUUID } from 'crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuditSeverite, AuditResultat, Prisma } from '@prisma/client';
import { unparse } from 'papaparse';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DepotScopeService } from '../common/depot-scope.service';
import { PrismaService } from '../prisma.service';
import { AuditGateway } from './audit.gateway';
import { sanitizeAuditValue } from './audit-sanitizer';

export interface AuditInput {
  tenantId: string;
  depotId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  severite?: AuditSeverite;
  targetType: string;
  targetId?: string | null;
  reference?: string | null;
  description: string;
  valeurAvant?: unknown;
  valeurApres?: unknown;
  montant?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  motif?: string | null;
  resultat?: AuditResultat;
  sessionId?: string | null;
  requestId?: string | null;
  metier?: string | null;
}

export interface AuditJournalFilters {
  action?: string;
  severite?: AuditSeverite;
  resultat?: AuditResultat;
  metier?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  depotId?: string | null;
  search?: string;
  montantMin?: number;
  montantMax?: number;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = stableValue((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
  return value;
}

function hashAuditEntry(entry: Record<string, unknown>, previousHash: string | null): string {
  return createHash('sha256')
    .update(JSON.stringify(stableValue({ previousHash, entry })), 'utf8')
    .digest('hex');
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly depotScope: DepotScopeService,
    private readonly auditGateway: AuditGateway,
  ) {}

  private assertAuthoritativeScope(input: AuditInput): { tenantId: string; depotId: string | null } {
    const scope = this.depotScope.getScope();
    if (!scope.tenantId) throw new ForbiddenException('Contexte tenant requis pour écrire un audit.');
    if (input.tenantId !== scope.tenantId) throw new ForbiddenException('Le tenant de l’audit ne correspond pas au contexte authentifié.');

    const scopedDepotId = scope.depotId;
    if (scopedDepotId && input.depotId && input.depotId !== scopedDepotId) {
      throw new ForbiddenException('Le dépôt de l’audit ne correspond pas au contexte authentifié.');
    }
    if (!scopedDepotId && input.depotId) {
      throw new ForbiddenException('Un dépôt ne peut pas être injecté hors du périmètre dépôt authentifié.');
    }
    return { tenantId: scope.tenantId, depotId: input.depotId ?? scopedDepotId };
  }

  private auditHashPayload(entry: any): Record<string, unknown> {
    return {
      id: entry.id, tenantId: entry.tenantId, depotId: entry.depotId ?? null,
      actorUserId: entry.actorUserId ?? null, actorEmail: entry.actorEmail ?? null,
      actorRole: entry.actorRole ?? null, action: entry.action, targetType: entry.targetType,
      targetId: entry.targetId ?? null, reference: entry.reference ?? null,
      description: entry.description, valeurAvant: entry.valeurAvant ?? null,
      valeurApres: entry.valeurApres ?? null, metadataText: entry.metadataText ?? null,
      severite: entry.severite, resultat: entry.resultat ?? null, metier: entry.metier ?? null,
      motif: entry.motif ?? null, requestId: entry.requestId ?? null,
      sessionId: entry.sessionId ?? null, ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null, montant: entry.montant ?? null,
      createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
    };
  }

  private async persistEvent(tx: Prisma.TransactionClient, input: AuditInput, authoritativeDepotId?: string | null) {
    const tenantId = input.tenantId.trim();
    if (!tenantId) throw new ForbiddenException('Tenant invalide pour l’audit.');

    const depotId = input.depotId ?? authoritativeDepotId ?? null;
    const safeBefore = sanitizeAuditValue(input.valeurAvant);
    const safeAfter = sanitizeAuditValue(input.valeurApres);
    const safeMetadata = input.metadata ? sanitizeAuditValue(input.metadata) : null;

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenantId}, 0))`;
    const previous = await tx.$queryRaw<Array<{ hash: string }>>`
      SELECT "hash" FROM "AuditIntegrity"
      WHERE "tenantId" = ${tenantId}
      ORDER BY "createdAt" DESC, "id" DESC LIMIT 1
    `;
    const previousHash = previous[0]?.hash ?? null;

    const created = await tx.journalAudit.create({
      data: {
        tenantId,
        depotId,
        actorUserId: input.actorUserId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        severite: input.severite ?? AuditSeverite.INFO,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        reference: input.reference ?? null,
        description: input.description,
        valeurAvant: (safeBefore ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        valeurApres: (safeAfter ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        montant: input.montant ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadataText: safeMetadata ? JSON.stringify(safeMetadata) : null,
        motif: input.motif ?? null,
        resultat: input.resultat ?? AuditResultat.SUCCES,
        sessionId: input.sessionId ?? null,
        requestId: input.requestId ?? this.depotScope.getRequestId(),
        metier: input.metier ?? this.depotScope.getMetier(),
      },
    });

    const hash = hashAuditEntry(this.auditHashPayload(created), previousHash);
    await tx.$executeRaw`
      INSERT INTO "AuditIntegrity" ("id", "tenantId", "journalAuditId", "previousHash", "hash")
      VALUES (${randomUUID()}, ${created.tenantId}, ${created.id}, ${previousHash}, ${hash})
    `;
    return created;
  }

  async logEvent(input: AuditInput) {
    const authoritative = this.assertAuthoritativeScope(input);
    const entry = await this.prisma.$transaction((tx) => this.persistEvent(tx, input, authoritative.depotId));
    this.emitAuditUpdate(authoritative.tenantId, entry);
    return entry;
  }

  /** Usage strictement interne : ajoute l’audit à une transaction métier déjà ouverte. */
  async logEventInTransaction(tx: Prisma.TransactionClient, input: AuditInput) {
    return this.persistEvent(tx, input);
  }

  /** Émission uniquement après validation du commit de la transaction métier. */
  emitAuditUpdate(tenantId: string, entry: unknown): void {
    this.auditGateway.emitAuditUpdate(tenantId, entry);
  }

  private buildWhere(tenantId: string, filters?: AuditJournalFilters): Prisma.JournalAuditWhereInput {
    const depotId = filters?.depotId ?? this.depotScope.getDepotId();
    let createdAtFilter: Prisma.DateTimeFilter | undefined;
    if (filters?.startDate || filters?.endDate) {
      createdAtFilter = {};
      if (filters.startDate) createdAtFilter.gte = new Date(filters.startDate);
      if (filters.endDate) { const end = new Date(filters.endDate); end.setHours(23, 59, 59, 999); createdAtFilter.lte = end; }
    }
    let montantFilter: Prisma.FloatNullableFilter | undefined;
    if (filters?.montantMin !== undefined || filters?.montantMax !== undefined) {
      montantFilter = {};
      if (filters.montantMin !== undefined) montantFilter.gte = filters.montantMin;
      if (filters.montantMax !== undefined) montantFilter.lte = filters.montantMax;
    }
    const search = filters?.search?.trim();
    return {
      tenantId, ...(depotId ? { depotId } : {}), ...(filters?.action ? { action: filters.action } : {}),
      ...(filters?.severite ? { severite: filters.severite } : {}), ...(filters?.resultat ? { resultat: filters.resultat } : {}),
      ...(filters?.metier ? { metier: filters.metier } : {}), ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(montantFilter ? { montant: montantFilter } : {}),
      ...(search ? { OR: [{ description: { contains: search, mode: 'insensitive' } }, { reference: { contains: search, mode: 'insensitive' } }, { actorEmail: { contains: search, mode: 'insensitive' } }, { motif: { contains: search, mode: 'insensitive' } }] } : {}),
    };
  }

  private parseMetadata(metadataText: string | null): Record<string, unknown> | null {
    if (!metadataText) return null;
    try { const parsed = JSON.parse(metadataText); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; } catch { return null; }
  }

  async getJournalPatron(tenantId: string, filters?: AuditJournalFilters) {
    const rows = await this.prisma.journalAudit.findMany({ where: this.buildWhere(tenantId, filters), orderBy: { createdAt: 'desc' }, take: filters?.limit ?? 100 });
    return rows.map((row) => ({ ...row, metadata: this.parseMetadata(row.metadataText) }));
  }

  async verifyIntegrity(tenantId: string) {
    const rows = await this.prisma.$queryRaw<Array<any>>`
      SELECT ai."journalAuditId", ai."previousHash", ai."hash", ja."id" AS "journalId", ja."createdAt" AS "journalCreatedAt", ja."tenantId" AS "journalTenantId", ja."depotId" AS "journalDepotId", ja."actorUserId", ja."actorEmail", ja."actorRole", ja."action", ja."targetType", ja."targetId", ja."reference", ja."description", ja."valeurAvant", ja."valeurApres", ja."metadataText", ja."severite", ja."resultat", ja."metier", ja."motif", ja."requestId", ja."sessionId", ja."ipAddress", ja."userAgent", ja."montant"
      FROM "AuditIntegrity" ai INNER JOIN "JournalAudit" ja ON ja."id" = ai."journalAuditId"
      WHERE ai."tenantId" = ${tenantId} ORDER BY ai."createdAt" ASC, ai."id" ASC
    `;
    const totalJournal = await this.prisma.journalAudit.count({ where: { tenantId } });
    let previousHash: string | null = null;
    const failures: Array<{ journalAuditId: string; reason: string }> = [];
    for (const row of rows) {
      if (row.previousHash !== previousHash) failures.push({ journalAuditId: row.journalAuditId, reason: 'Chaînage précédent incohérent.' });
      const entry = { id: row.journalId, tenantId: row.journalTenantId, depotId: row.journalDepotId, actorUserId: row.actorUserId, actorEmail: row.actorEmail, actorRole: row.actorRole, action: row.action, targetType: row.targetType, targetId: row.targetId, reference: row.reference, description: row.description, valeurAvant: row.valeurAvant, valeurApres: row.valeurApres, metadataText: row.metadataText, severite: row.severite, resultat: row.resultat, metier: row.metier, motif: row.motif, requestId: row.requestId, sessionId: row.sessionId, ipAddress: row.ipAddress, userAgent: row.userAgent, montant: row.montant, createdAt: row.journalCreatedAt.toISOString() };
      if (hashAuditEntry(entry, row.previousHash) !== row.hash) failures.push({ journalAuditId: row.journalAuditId, reason: 'Empreinte SHA-256 invalide.' });
      previousHash = row.hash;
    }
    return { intact: failures.length === 0, protectedEntries: rows.length, unprotectedEntries: Math.max(totalJournal - rows.length, 0), checkedAt: new Date().toISOString(), failures: failures.slice(0, 50) };
  }

  async detectUnusualActivity(tenantId: string, hours = 24) {
    const safeHours = Math.min(Math.max(Number.isFinite(hours) ? Math.floor(hours) : 24, 1), 168);
    const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
    const rows = await this.prisma.journalAudit.findMany({ where: { tenantId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 5000, select: { id: true, actorUserId: true, actorEmail: true, action: true, severite: true, resultat: true, createdAt: true, ipAddress: true, description: true } });
    const byActor = new Map<string, number>(); const byActorIp = new Map<string, Set<string>>();
    for (const row of rows) { const actor = row.actorUserId || row.actorEmail || 'unknown'; byActor.set(actor, (byActor.get(actor) ?? 0) + 1); if (row.ipAddress) { if (!byActorIp.has(actor)) byActorIp.set(actor, new Set()); byActorIp.get(actor)!.add(row.ipAddress); } }
    const alerts: Array<Record<string, unknown>> = [];
    for (const [actor, count] of byActor) { if (count >= 100) alerts.push({ type: 'BURST', actor, score: 90, detail: `${count} événements en ${safeHours}h.` }); const ips = byActorIp.get(actor)?.size ?? 0; if (ips >= 4) alerts.push({ type: 'MULTI_IP', actor, score: 75, detail: `${ips} adresses IP distinctes sur la période.` }); }
    const failed = rows.filter((row) => row.resultat === AuditResultat.ECHEC).length; const critical = rows.filter((row) => row.severite === AuditSeverite.CRITIQUE).length;
    if (failed >= 10) alerts.push({ type: 'FAILURES', score: 80, detail: `${failed} opérations en échec.` });
    if (critical >= 5) alerts.push({ type: 'CRITICAL_SPIKE', score: 85, detail: `${critical} événements critiques.` });
    return { periodHours: safeHours, scannedEvents: rows.length, unusual: alerts.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 50), generatedAt: new Date().toISOString() };
  }

  async getDashboard(tenantId: string, hours = 24) {
    const safeHours = Math.min(Math.max(Number.isFinite(hours) ? Math.floor(hours) : 24, 1), 168); const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
    const [total, successes, failures, critical, attention, info, actors] = await Promise.all([
      this.prisma.journalAudit.count({ where: { tenantId, createdAt: { gte: since } } }), this.prisma.journalAudit.count({ where: { tenantId, createdAt: { gte: since }, resultat: AuditResultat.SUCCES } }), this.prisma.journalAudit.count({ where: { tenantId, createdAt: { gte: since }, resultat: AuditResultat.ECHEC } }), this.prisma.journalAudit.count({ where: { tenantId, createdAt: { gte: since }, severite: AuditSeverite.CRITIQUE } }), this.prisma.journalAudit.count({ where: { tenantId, createdAt: { gte: since }, severite: AuditSeverite.ATTENTION } }), this.prisma.journalAudit.count({ where: { tenantId, createdAt: { gte: since }, severite: AuditSeverite.INFO } }), this.prisma.journalAudit.findMany({ where: { tenantId, createdAt: { gte: since }, actorUserId: { not: null } }, distinct: ['actorUserId'], select: { actorUserId: true } }),
    ]);
    const anomalies = await this.detectUnusualActivity(tenantId, safeHours);
    return { periodHours: safeHours, total, successes, failures, successRate: total ? Number(((successes / total) * 100).toFixed(2)) : 100, severity: { critical, attention, info }, activeActors: actors.length, anomalyCount: anomalies.unusual.length, generatedAt: new Date().toISOString() };
  }

  private csvSafe(value: unknown): string | number { if (value === null || value === undefined) return ''; const text = typeof value === 'string' ? value : JSON.stringify(value); return /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text; }

  async exportJournalCSV(tenantId: string, filters?: AuditJournalFilters) {
    const rows = await this.prisma.journalAudit.findMany({ where: this.buildWhere(tenantId, filters), orderBy: { createdAt: 'desc' }, take: 20000 });
    const lignes = rows.map((r) => ({ Date: this.csvSafe(r.createdAt.toISOString()), Action: this.csvSafe(r.action), Sévérité: this.csvSafe(r.severite), Résultat: this.csvSafe(r.resultat), Métier: this.csvSafe(r.metier), Dépôt: this.csvSafe(r.depotId), Utilisateur: this.csvSafe(r.actorEmail), Rôle: this.csvSafe(r.actorRole), Cible: this.csvSafe(r.targetType), Référence: this.csvSafe(r.reference), Description: this.csvSafe(r.description), Motif: this.csvSafe(r.motif), Montant: r.montant ?? '', 'Valeur avant': this.csvSafe(r.valeurAvant), 'Valeur après': this.csvSafe(r.valeurApres), IP: this.csvSafe(r.ipAddress), RequestId: this.csvSafe(r.requestId) }));
    return Buffer.from('\uFEFF' + unparse(lignes, { header: true }), 'utf-8');
  }

  async exportJournalPDF(tenantId: string, filters?: AuditJournalFilters) {
    const rows = await this.prisma.journalAudit.findMany({ where: this.buildWhere(tenantId, filters), orderBy: { createdAt: 'desc' }, take: 500 });
    const pdfDoc = await PDFDocument.create(); const font = await pdfDoc.embedFont(StandardFonts.Helvetica); const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold); const pageWidth = 841.89; const pageHeight = 595.28; const margin = 30; const lineHeight = 14; let page = pdfDoc.addPage([pageWidth, pageHeight]); let y = pageHeight - margin;
    const drawHeader = () => { page.drawText('Journal Audit Patron — GeStock', { x: margin, y, size: 14, font: fontBold }); y -= 20; page.drawText(`Exporté le ${new Date().toLocaleString('fr-FR')}`, { x: margin, y, size: 8, font }); y -= 18; ['Date','Action','Sévérité','Utilisateur','Description'].forEach((h,i) => page.drawText(h,{x:[margin,margin+90,margin+190,margin+260,margin+400][i],y,size:9,font:fontBold})); y -= lineHeight; };
    drawHeader(); const colX = [margin, margin + 90, margin + 190, margin + 260, margin + 400];
    for (const r of rows) { if (y < margin + lineHeight) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; drawHeader(); } const truncate=(s:string,n:number)=>s.length>n?s.slice(0,n-1)+'…':s; [r.createdAt.toISOString().slice(0,16).replace('T',' '),truncate(r.action,22),r.severite,truncate(r.actorEmail??'—',26),truncate(r.description,60)].forEach((v,i)=>page.drawText(v,{x:colX[i],y,size:8,font})); y -= lineHeight; }
    return Buffer.from(await pdfDoc.save());
  }

  async getResume(tenantId: string, from: Date, to: Date) {
    const [revenus, depenses] = await Promise.all([this.prisma.vente.aggregate({ where: { tenantId, date: { gte: from, lte: to }, statut: 'PAYE' }, _sum: { total: true } }), this.prisma.commandeFournisseur.aggregate({ where: { tenantId, dateCommande: { gte: from, lte: to } }, _sum: { total: true } })]);
    return { revenus: revenus._sum.total ?? 0, depenses: depenses._sum.total ?? 0, resultat: (revenus._sum.total ?? 0) - (depenses._sum.total ?? 0) };
  }
}