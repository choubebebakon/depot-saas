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
  // Champs "données obligatoires" du cahier des charges Audit Patron.
  // motif/sessionId n'ont pas encore de source fiable partout (voir
  // limites documentées dans le schéma) : laissés `undefined` la plupart
  // du temps, ce n'est pas un oubli. requestId/metier, eux, sont
  // automatiquement complétés depuis le contexte de requête (ALS) si non
  // fournis explicitement — donc déjà renseignés rétroactivement pour
  // tous les appels logEvent() existants sans y toucher.
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
  // Recherche combinée précise (cahier des charges, section 18) : un
  // Patron doit pouvoir taper "Jean stock modification Douala" et
  // retrouver les lignes correspondantes. `search` filtre sur
  // description/référence/email acteur ; combiné aux filtres structurés
  // ci-dessus (action/dépôt/métier/date/sévérité) ça couvre le cas
  // d'usage du document sans avoir à construire un moteur de recherche
  // dédié.
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

    // Diffusion temps réel vers le dashboard patron connecté
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
      if (filters.startDate) {
        createdAtFilter.gte = new Date(filters.startDate);
      }
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

  async getJournalPatron(tenantId: string, filters?: AuditJournalFilters) {
    const where = this.buildWhere(tenantId, filters);

    const rows = await this.prisma.journalAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100,
    });

    return rows.map((row) => ({
      ...row,
      metadata: row.metadataText ? JSON.parse(row.metadataText) : null,
    }));
  }

  /**
   * Export CSV du journal — pas de limite de lignes (contrairement à
   * getJournalPatron plafonné à 100 par défaut pour l'écran) : un export
   * sert justement à sortir toutes les données correspondant aux filtres.
   * Plafonné à 20 000 lignes par sécurité (évite un export accidentel
   * démesuré qui bloquerait le processus Node).
   */
  async exportJournalCSV(tenantId: string, filters?: AuditJournalFilters) {
    const where = this.buildWhere(tenantId, filters);
    const rows = await this.prisma.journalAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20000,
    });

    const lignes = rows.map((r) => ({
      Date: r.createdAt.toISOString(),
      Action: r.action,
      Sévérité: r.severite,
      // Résultat: (r as any).resultat ?? '',
      // Métier: (r as any).metier ?? '',
      Dépôt: r.depotId ?? '',
      Utilisateur: r.actorEmail ?? '',
      Rôle: r.actorRole ?? '',
      Cible: r.targetType,
      Référence: r.reference ?? '',
      Description: r.description,
      // Motif: (r as any).motif ?? '',
      Montant: r.montant ?? '',
      'Valeur avant': r.valeurAvant ? JSON.stringify(r.valeurAvant) : '',
      'Valeur après': r.valeurApres ? JSON.stringify(r.valeurApres) : '',
      IP: r.ipAddress ?? '',
      // RequestId: (r as any).requestId ?? '',
    }));

    const csv = unparse(lignes, { header: true });
    // BOM UTF-8 : Excel (très majoritaire chez les Patrons) affiche mal
    // les accents français sans ça.
    return Buffer.from('\uFEFF' + csv, 'utf-8');
  }

  /**
   * Export PDF du journal — plafonné à 500 lignes (contrairement au CSV) :
   * un PDF est un format de lecture/impression, pas un format de données
   * brutes. Au-delà, le document devient impraticable à consulter ; pour
   * une extraction complète, le CSV est le bon outil.
   */
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

    const pageWidth = 841.89; // A4 paysage
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
      const headerCols = [
        'Date',
        'Action',
        'Sévérité',
        'Utilisateur',
        'Description',
      ];
      const colX = [margin, margin + 90, margin + 190, margin + 260, margin + 400];
      headerCols.forEach((h, i) => {
        page.drawText(h, { x: colX[i], y, size: 9, font: fontBold });
      });
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
      const truncate = (s: string, n: number) =>
        s.length > n ? s.slice(0, n - 1) + '…' : s;

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
          color:
            r.severite === AuditSeverite.CRITIQUE
              ? rgb(0.7, 0, 0)
              : rgb(0.1, 0.1, 0.1),
        });
      });
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }

  // GET /resume — Résumé financier période (inchangé)
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