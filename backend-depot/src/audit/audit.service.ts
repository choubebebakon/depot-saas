import { Injectable } from '@nestjs/common';
import { AuditSeverite, Prisma } from '@prisma/client';
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
      },
    });

    // Diffusion temps réel vers le dashboard patron connecté
    this.auditGateway.emitAuditUpdate(input.tenantId, entry);

    return entry;
  }

  async getJournalPatron(
    tenantId: string,
    filters?: {
      action?: string;
      severite?: AuditSeverite;
      startDate?: string;
      endDate?: string;
      limit?: number;
      depotId?: string | null;
    },
  ) {
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

    const where: Prisma.JournalAuditWhereInput = {
      tenantId,
      ...(depotId ? { depotId } : {}),
      ...(filters?.action ? { action: filters.action } : {}),
      ...(filters?.severite ? { severite: filters.severite } : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    };

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
