import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';

type AuditInput = {
    tenantId: string;
    actorUserId?: string | null;
    actorEmail?: string | null;
    actorRole?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    reference?: string | null;
    description: string;
    metadata?: Record<string, unknown> | null;
};

type AuditRow = {
    id: string;
    tenantId: string;
    actorUserId: string | null;
    actorEmail: string | null;
    actorRole: string | null;
    action: string;
    targetType: string;
    targetId: string | null;
    reference: string | null;
    description: string;
    metadataText: string | null;
    createdAt: Date;
};

@Injectable()
export class AuditService {
    constructor(private readonly prisma: PrismaService) { }

    async logEvent(input: AuditInput) {
        await this.prisma.$executeRawUnsafe(
            `INSERT INTO "JournalAudit"
            ("id", "tenantId", "actorUserId", "actorEmail", "actorRole", "action", "targetType", "targetId", "reference", "description", "metadataText", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            randomUUID(),
            input.tenantId,
            input.actorUserId ?? null,
            input.actorEmail ?? null,
            input.actorRole ?? null,
            input.action,
            input.targetType,
            input.targetId ?? null,
            input.reference ?? null,
            input.description,
            input.metadata ? JSON.stringify(input.metadata) : null,
        );
    }

    async getJournalPatron(
        tenantId: string,
        filters?: {
            action?: string;
            startDate?: string;
            endDate?: string;
            limit?: number;
        },
    ) {
        const conditions = [`"tenantId" = $1`];
        const params: any[] = [tenantId];

        if (filters?.action) {
            params.push(filters.action);
            conditions.push(`"action" = $${params.length}`);
        }

        if (filters?.startDate) {
            params.push(new Date(filters.startDate));
            conditions.push(`"createdAt" >= $${params.length}`);
        }

        if (filters?.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            params.push(endDate);
            conditions.push(`"createdAt" <= $${params.length}`);
        }

        params.push(filters?.limit ?? 100);

        const rows = await this.prisma.$queryRawUnsafe<AuditRow[]>(
            `SELECT *
             FROM "JournalAudit"
             WHERE ${conditions.join(' AND ')}
             ORDER BY "createdAt" DESC
             LIMIT $${params.length}`,
            ...params,
        );

        return rows.map((row) => ({
            ...row,
            metadata: row.metadataText ? JSON.parse(row.metadataText) : null,
        }));
    }
}
