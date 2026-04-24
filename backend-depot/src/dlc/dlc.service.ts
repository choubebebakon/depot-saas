import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum StatutDLC {
    OK = 'OK',
    ATTENTION = 'ATTENTION',
    URGENT = 'URGENT',
    EXPIRE = 'EXPIRE',
}

@Injectable()
export class DlcService {
    constructor(private prisma: PrismaService) { }

    private requireDepotId(depotId?: string) {
        if (!depotId) {
            throw new BadRequestException('depotId est obligatoire pour isoler les lots du depot actif.');
        }

        return depotId;
    }

    getStatutDLC(dlc: Date | null): StatutDLC {
        if (!dlc) return StatutDLC.OK;
        const now = new Date();
        const diffJours = Math.floor((dlc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffJours < 0) return StatutDLC.EXPIRE;
        if (diffJours < 7) return StatutDLC.URGENT;
        if (diffJours < 30) return StatutDLC.ATTENTION;
        return StatutDLC.OK;
    }

    async creerLot(data: {
        articleId: string;
        depotId: string;
        tenantId: string;
        quantite: number;
        dlc?: Date;
        numeroLot?: string;
    }) {
        return this.prisma.lotStock.create({
            data: {
                articleId: data.articleId,
                depotId: data.depotId,
                tenantId: data.tenantId,
                quantite: data.quantite,
                quantiteInitiale: data.quantite,
                dlc: data.dlc || null,
                numeroLot: data.numeroLot || null,
            },
            include: { article: true, depot: true },
        });
    }

    async findLots(tenantId: string, depotId?: string) {
        const selectedDepotId = this.requireDepotId(depotId);

        const lots = await this.prisma.lotStock.findMany({
            where: {
                tenantId,
                depotId: selectedDepotId,
                quantite: { gt: 0 },
            },
            include: {
                article: {
                    include: { famille: true, marque: true },
                },
                depot: true,
            },
            orderBy: { dlc: 'asc' },
        });

        return lots.map(lot => ({
            ...lot,
            statutDLC: this.getStatutDLC(lot.dlc),
            joursRestants: lot.dlc
                ? Math.floor((lot.dlc.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null,
        }));
    }

    async getAlertes(tenantId: string, depotId?: string) {
        const lots = await this.findLots(tenantId, depotId);
        return lots.filter(l =>
            l.statutDLC === StatutDLC.URGENT ||
            l.statutDLC === StatutDLC.EXPIRE ||
            l.statutDLC === StatutDLC.ATTENTION
        );
    }

    async getStats(tenantId: string, depotId?: string) {
        const lots = await this.findLots(tenantId, depotId);

        return {
            total: lots.length,
            ok: lots.filter(l => l.statutDLC === StatutDLC.OK).length,
            attention: lots.filter(l => l.statutDLC === StatutDLC.ATTENTION).length,
            urgent: lots.filter(l => l.statutDLC === StatutDLC.URGENT).length,
            expire: lots.filter(l => l.statutDLC === StatutDLC.EXPIRE).length,
        };
    }

    async deduireLotFIFO(
        articleId: string,
        depotId: string,
        tenantId: string,
        quantiteADeduire: number,
    ) {
        const lots = await this.prisma.lotStock.findMany({
            where: { articleId, depotId, tenantId, quantite: { gt: 0 } },
            orderBy: [
                { dlc: 'asc' },
                { createdAt: 'asc' },
            ],
        });

        let restantADeduire = quantiteADeduire;

        for (const lot of lots) {
            if (restantADeduire <= 0) break;

            const deduction = Math.min(lot.quantite, restantADeduire);
            await this.prisma.lotStock.update({
                where: { id: lot.id },
                data: { quantite: lot.quantite - deduction },
            });
            restantADeduire -= deduction;
        }
    }

    async updateLot(id: string, tenantId: string, data: { dlc?: Date; numeroLot?: string }) {
        return this.prisma.lotStock.update({
            where: { id },
            data,
            include: { article: true, depot: true },
        });
    }
}
