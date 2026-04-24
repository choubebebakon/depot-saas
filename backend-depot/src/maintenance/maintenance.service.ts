import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMaintenanceDto, CreateCarburantDto } from './dto/maintenance.dto';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    // ── Maintenances ─────────────────────────────────────────

    async createMaintenance(dto: CreateMaintenanceDto) {
        return this.prisma.maintenanceTricycle.create({
            data: {
                tricycleId: dto.tricycleId,
                tenantId: dto.tenantId,
                type: dto.type as any,
                statut: dto.dateEffectue ? 'EFFECTUE' : 'PLANIFIE',
                description: dto.description,
                cout: dto.cout,
                kilometrage: dto.kilometrage,
                photoUrl: dto.photoUrl,
                datePlanifie: dto.datePlanifie ? new Date(dto.datePlanifie) : null,
                dateEffectue: dto.dateEffectue ? new Date(dto.dateEffectue) : null,
            },
            include: { tricycle: true },
        });
    }

    async validerMaintenance(id: string) {
        return this.prisma.maintenanceTricycle.update({
            where: { id },
            data: { statut: 'EFFECTUE', dateEffectue: new Date() },
        });
    }

    async findMaintenances(tenantId: string, tricycleId?: string) {
        return this.prisma.maintenanceTricycle.findMany({
            where: {
                tenantId,
                ...(tricycleId ? { tricycleId } : {}),
            },
            include: { tricycle: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getMaintenancesEnRetard(tenantId: string) {
        const now = new Date();
        return this.prisma.maintenanceTricycle.findMany({
            where: {
                tenantId,
                statut: 'PLANIFIE',
                datePlanifie: { lt: now },
            },
            include: { tricycle: true },
            orderBy: { datePlanifie: 'asc' },
        });
    }

    // ── Carburant ─────────────────────────────────────────────

    async createCarburant(dto: CreateCarburantDto) {
        const montantTotal = dto.litres * dto.prixLitre;
        return this.prisma.consommationCarburant.create({
            data: {
                tricycleId: dto.tricycleId,
                tenantId: dto.tenantId,
                litres: dto.litres,
                prixLitre: dto.prixLitre,
                montantTotal,
                kilometrage: dto.kilometrage,
                nbTours: dto.nbTours || 0,
            },
            include: { tricycle: true },
        });
    }

    async findCarburants(tenantId: string, tricycleId?: string) {
        return this.prisma.consommationCarburant.findMany({
            where: {
                tenantId,
                ...(tricycleId ? { tricycleId } : {}),
            },
            include: { tricycle: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ── Stats par tricycle ────────────────────────────────────

    async getStatsTricycle(tricycleId: string, tenantId: string) {
        const [maintenances, carburants] = await Promise.all([
            this.prisma.maintenanceTricycle.findMany({
                where: { tricycleId, tenantId },
            }),
            this.prisma.consommationCarburant.findMany({
                where: { tricycleId, tenantId },
            }),
        ]);

        const coutMaintenanceTotal = maintenances
            .filter(m => m.statut === 'EFFECTUE')
            .reduce((acc, m) => acc + m.cout, 0);

        const coutCarburantTotal = carburants
            .reduce((acc, c) => acc + c.montantTotal, 0);

        const litresTotal = carburants.reduce((acc, c) => acc + c.litres, 0);
        const toursTotal = carburants.reduce((acc, c) => acc + c.nbTours, 0);

        const planifiees = maintenances.filter(m => m.statut === 'PLANIFIE').length;
        const enRetard = maintenances.filter(
            m => m.statut === 'PLANIFIE' && m.datePlanifie && m.datePlanifie < new Date()
        ).length;

        return {
            coutMaintenanceTotal,
            coutCarburantTotal,
            coutTotal: coutMaintenanceTotal + coutCarburantTotal,
            litresTotal,
            toursTotal,
            nbMaintenances: maintenances.length,
            planifiees,
            enRetard,
            consommationMoyenne: toursTotal > 0 ? (litresTotal / toursTotal).toFixed(2) : 0,
        };
    }

    async getStatsTousLesTriycles(tenantId: string) {
        const tricycles = await this.prisma.tricycle.findMany({
            where: { tenantId },
        });

        const stats = await Promise.all(
            tricycles.map(async t => ({
                tricycle: t,
                stats: await this.getStatsTricycle(t.id, tenantId),
            }))
        );

        // Période du mois en cours
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);

        const carburantsMois = await this.prisma.consommationCarburant.aggregate({
            where: { tenantId, createdAt: { gte: debutMois } },
            _sum: { montantTotal: true, litres: true },
        });

        const maintenancesMois = await this.prisma.maintenanceTricycle.aggregate({
            where: { tenantId, statut: 'EFFECTUE', dateEffectue: { gte: debutMois } },
            _sum: { cout: true },
        });

        return {
            tricycles: stats,
            totalMois: {
                carburant: carburantsMois._sum.montantTotal || 0,
                maintenance: maintenancesMois._sum.cout || 0,
                litres: carburantsMois._sum.litres || 0,
            },
        };
    }
}
