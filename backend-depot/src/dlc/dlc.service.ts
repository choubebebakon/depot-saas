import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum StatutDLC {
    OK = 'OK',
    ATTENTION = 'ATTENTION', // < 30 jours
    URGENT = 'URGENT',       // < 7 jours
    EXPIRE = 'EXPIRE',       // dépassé
}

@Injectable()
export class DlcService {
    constructor(private prisma: PrismaService) { }

    // Calcule le statut d'une DLC
    getStatutDLC(dlc: Date | null): StatutDLC {
        if (!dlc) return StatutDLC.OK;
        const now = new Date();
        const diffJours = Math.floor((dlc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffJours < 0) return StatutDLC.EXPIRE;
        if (diffJours < 7) return StatutDLC.URGENT;
        if (diffJours < 30) return StatutDLC.ATTENTION;
        return StatutDLC.OK;
    }

    // Crée un lot lors d'une réception
    async creerLot(data: {
        articleId: string;
        siteId: string;
        tenantId: string;
        quantite: number;
        dlc?: Date;
        numeroLot?: string;
    }) {
        return this.prisma.lotStock.create({
            data: {
                articleId: data.articleId,
                siteId: data.siteId,
                tenantId: data.tenantId,
                quantite: data.quantite,
                quantiteInitiale: data.quantite,
                dlc: data.dlc || null,
                numeroLot: data.numeroLot || null,
            },
            include: { article: true, site: true },
        });
    }

    // Tous les lots avec leur statut DLC
    async findLots(tenantId: string, siteId?: string) {
        const lots = await this.prisma.lotStock.findMany({
            where: {
                tenantId,
                quantite: { gt: 0 }, // seulement les lots non épuisés
                ...(siteId ? { siteId } : {}),
            },
            include: {
                article: {
                    include: { famille: true, marque: true },
                },
                site: true,
            },
            orderBy: { dlc: 'asc' }, // FIFO : plus ancienne DLC en premier
        });

        return lots.map(lot => ({
            ...lot,
            statutDLC: this.getStatutDLC(lot.dlc),
            joursRestants: lot.dlc
                ? Math.floor((lot.dlc.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null,
        }));
    }

    // Alertes DLC critiques (urgentes + expirées)
    async getAlertes(tenantId: string, siteId?: string) {
        const lots = await this.findLots(tenantId, siteId);
        return lots.filter(l =>
            l.statutDLC === StatutDLC.URGENT ||
            l.statutDLC === StatutDLC.EXPIRE ||
            l.statutDLC === StatutDLC.ATTENTION
        );
    }

    // Stats DLC pour le dashboard
    async getStats(tenantId: string, siteId?: string) {
        const lots = await this.findLots(tenantId, siteId);

        return {
            total: lots.length,
            ok: lots.filter(l => l.statutDLC === StatutDLC.OK).length,
            attention: lots.filter(l => l.statutDLC === StatutDLC.ATTENTION).length,
            urgent: lots.filter(l => l.statutDLC === StatutDLC.URGENT).length,
            expire: lots.filter(l => l.statutDLC === StatutDLC.EXPIRE).length,
        };
    }

    // Déduire un lot (lors d'une vente — FIFO automatique)
    async deduireLotFIFO(
        articleId: string,
        siteId: string,
        tenantId: string,
        quantiteADeduire: number,
    ) {
        // Prend les lots dans l'ordre DLC croissante (les plus proches d'expirer en premier)
        const lots = await this.prisma.lotStock.findMany({
            where: { articleId, siteId, tenantId, quantite: { gt: 0 } },
            orderBy: [
                { dlc: 'asc' },    // DLC la plus proche d'abord
                { createdAt: 'asc' }, // En cas d'égalité, le plus ancien
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

    // Mettre à jour la DLC d'un lot
    async updateLot(id: string, tenantId: string, data: { dlc?: Date; numeroLot?: string }) {
        return this.prisma.lotStock.update({
            where: { id },
            data,
            include: { article: true, site: true },
        });
    }
}