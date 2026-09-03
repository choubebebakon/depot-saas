import { Injectable } from '@nestjs/common';
import { AuditSeverite, AuditResultat, Prisma } from '@prisma/client';
import { unparse } from 'papaparse';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DepotScopeService } from '../common/depot-scope.service';
import { PrismaService } from '../prisma.service';
import { AuditGateway } from './audit.gateway';

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

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly depotScope: DepotScopeService,
    private readonly auditGateway: AuditGateway,
  ) {}

  async logEvent(input: AuditInput) {
    const entry = await this.prisma.journalAudit.create({
      data: {
        tenantId: input.tenantId,
        depotId: input.depotId ?? this.depotScope.getDepotId(),
        actorUserId: input.actorUserId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        severite: input.severite ?? AuditSeverite.INFO,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        reference: input.reference ?? null,
        description: input.description,
        valeurAvant: (input.valeurAvant ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        valeurApres: (input.valeurApres ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        montant: input.montant ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadataText: input.metadata ? JSON.stringify(input.metadata) : null,
        motif: input.motif ?? null,
        resultat: input.resultat ?? AuditResultat.SUCCES,
        sessionId: input.sessionId ?? null,
        requestId: input.requestId ?? this.depotScope.getRequestId(),
        metier: input.metier ?? this.depotScope.getMetier(),
      },
    });

    this.auditGateway.emitAuditUpdate(input.tenantId, entry);
    return entry;
  }

  private buildWhere(
    tenantId: string,
    filters?: AuditJournalFilters,
  ): Prisma.JournalAuditWhereInput {
    const depotId = filters?.depotId ?? this.depotScope.getDepotId();

    let createdAtFilter: Prisma.DateTimeFilter | undefined;
    if (filters?.startDate || filters?.endDate) {
      createdAtFilter = {};
      if (filters.startDate) createdAtFilter.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        createdAtFilter.lte = end;
      }
    }

    let montantFilter: Prisma.FloatNullableFilter | undefined;
    if (filters?.montantMin !== undefined || filters?.montantMax !== undefined) {
      montantFilter = {};
      if (filters.montantMin !== undefined) montantFilter.gte = filters.montantMin;
      if (filters.montantMax !== undefined) montantFilter.lte = filters.montantMax;
    }

    const search = filters?.search?.trim();

    return {
      tenantId,
      ...(depotId ? { depotId } : {}),
      ...(filters?.action ? { action: filters.action } : {}),
      ...(filters?.severite ? { severite: filters.severite } : {}),
      ...(filters?.resultat ? { resultat: filters.resultat } : {}),
      ...(filters?.metier ? { metier: filters.metier } : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(montantFilter ? { montant: montantFilter } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { reference: { contains: search, mode: 'insensitive' } },
              { actorEmail: { contains: search, mode: 'insensitive' } },
              { motif: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private parseMetadata(metadataText: string | null): Record<string, unknown> | null {
    if (!metadataText) return null;
    try {
      const parsed = JSON.parse(metadataText);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      // Une ligne d'audit ne doit jamais faire tomber tout le journal parce
      // qu'un ancien metadataText est corrompu.
      return null;
    }
  }

  async getJournalPatron(tenantId: string, filters?: AuditJournalFilters) {
    const where = this.buildWhere(tenantId, filters);

    const rows = await this.prisma.journalAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100,
    });

    return rows.map((row) => ({
      ...row,
      metadata: this.parseMetadata(row.metadataText),
    }));
  }

  /** Défense contre l'injection de formules lors de l'ouverture du CSV dans Excel/LibreOffice. */
  private csvSafe(value: unknown): string | number {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (/^[=+\-@]/.test(text.trimStart())) return `'${text}`;
    return text;
  }

  async exportJournalCSV(tenantId: string, filters?: AuditJournalFilters) {
    const where = this.buildWhere(tenantId, filters);
    const rows = await this.prisma.journalAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20000,
    });

    const lignes = rows.map((r) => ({
      Date: this.csvSafe(r.createdAt.toISOString()),
      Action: this.csvSafe(r.action),
      Sévérité: this.csvSafe(r.severite),
      Résultat: this.csvSafe(r.resultat),
      Métier: this.csvSafe(r.metier),
      Dépôt: this.csvSafe(r.depotId),
      Utilisateur: this.csvSafe(r.actorEmail),
      Rôle: this.csvSafe(r.actorRole),
      Cible: this.csvSafe(r.targetType),
      Référence: this.csvSafe(r.reference),
      Description: this.csvSafe(r.description),
      Motif: this.csvSafe(r.motif),
      Montant: r.montant ?? '',
      'Valeur avant': this.csvSafe(r.valeurAvant),
      'Valeur après': this.csvSafe(r.valeurApres),
      IP: this.csvSafe(r.ipAddress),
      RequestId: this.csvSafe(r.requestId),
    }));

    const csv = unparse(lignes, { header: true });
    return Buffer.from('\uFEFF' + csv, 'utf-8');
  }

  async exportJournalPDF(tenantId: string, filters?: AuditJournalFilters) {
    const where = this.buildWhere(tenantId, filters);
    const rows = await this.prisma.journalAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 30;
    const lineHeight = 14;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawHeader = () => {
      page.drawText('Journal Audit Patron — GeStock', {
        x: margin,
        y,
        size: 14,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      y -= 20;
      page.drawText(`Exporté le ${new Date().toLocaleString('fr-FR')}`, {
        x: margin,
        y,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 18;
      const headerCols = ['Date', 'Action', 'Sévérité', 'Utilisateur', 'Description'];
      const colX = [margin, margin + 90, margin + 190, margin + 260, margin + 400];
      headerCols.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 9, font: fontBold }));
      y -= lineHeight;
      page.drawLine({
        start: { x: margin, y: y + 4 },
        end: { x: pageWidth - margin, y: y + 4 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
    };

    drawHeader();
    const colX = [margin, margin + 90, margin + 190, margin + 260, margin + 400];

    for (const r of rows) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        drawHeader();
      }
      const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
      const values = [
        r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
        truncate(r.action, 22),
        r.severite,
        truncate(r.actorEmail ?? '—', 26),
        truncate(r.description, 60),
      ];
      values.forEach((v, i) => {
        page.drawText(v, {
          x: colX[i],
          y,
          size: 8,
          font,
          color: r.severite === AuditSeverite.CRITIQUE ? rgb(0.7, 0, 0) : rgb(0.1, 0.1, 0.1),
        });
      });
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }

  async getResume(tenantId: string, from: Date, to: Date) {
    const [revenus, depenses] = await Promise.all([
      this.prisma.vente.aggregate({
        where: { tenantId, date: { gte: from, lte: to }, statut: 'PAYE' },
        _sum: { total: true },
      }),
      this.prisma.commandeFournisseur.aggregate({
        where: { tenantId, dateCommande: { gte: from, lte: to } },
        _sum: { total: true },
      }),
    ]);
    return {
      revenus: revenus._sum.total ?? 0,
      depenses: depenses._sum.total ?? 0,
      resultat: (revenus._sum.total ?? 0) - (depenses._sum.total ?? 0),
    };
  }
}
