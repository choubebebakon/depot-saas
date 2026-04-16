import { Injectable } from '@nestjs/common';
import { RoleUser, StatutVente, TypeMouvement } from '@prisma/client';
import { PrismaService } from '../prisma.service';

function getMonthRange(month?: string) {
    const now = new Date();
    const base = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
    const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
    return { start, end };
}

@Injectable()
export class RapportsService {
    constructor(private readonly prisma: PrismaService) { }

    async getTopProduitsParMarge(tenantId: string, siteId?: string, month?: string) {
        const { start, end } = getMonthRange(month);

        const ventes = await this.prisma.vente.findMany({
            where: {
                tenantId,
                statut: StatutVente.PAYE,
                date: { gte: start, lt: end },
                ...(siteId ? { siteId } : {}),
            },
            include: {
                lignes: {
                    include: { article: true },
                },
            },
        });

        const byArticle = new Map<string, any>();

        for (const vente of ventes) {
            for (const ligne of vente.lignes) {
                const current = byArticle.get(ligne.articleId) || {
                    articleId: ligne.articleId,
                    designation: ligne.article.designation,
                    format: ligne.article.format,
                    quantiteVendue: 0,
                    chiffreAffaires: 0,
                    coutAchat: 0,
                    margeBrute: 0,
                    tauxMarge: 0,
                };

                current.quantiteVendue += ligne.quantite;
                current.chiffreAffaires += ligne.total;
                current.coutAchat += ligne.quantite * (ligne.article.prixAchat || 0);
                current.margeBrute = current.chiffreAffaires - current.coutAchat;
                current.tauxMarge = current.chiffreAffaires > 0
                    ? Number(((current.margeBrute / current.chiffreAffaires) * 100).toFixed(2))
                    : 0;

                byArticle.set(ligne.articleId, current);
            }
        }

        return Array.from(byArticle.values())
            .sort((a, b) => b.margeBrute - a.margeBrute)
            .slice(0, 5);
    }

    async getPerformanceCommerciaux(tenantId: string, month?: string) {
        const { start, end } = getMonthRange(month);

        const commerciaux = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: RoleUser.COMMERCIAL,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        const ventes = await this.prisma.vente.findMany({
            where: {
                tenantId,
                statut: StatutVente.PAYE,
                date: { gte: start, lt: end },
            },
            include: {
                lignes: { include: { article: true } },
                tournee: { select: { commercialId: true, reference: true } },
                createur: { select: { id: true, role: true } },
            },
        });

        const tournees = await this.prisma.tournee.findMany({
            where: {
                tenantId,
                dateOuverture: { gte: start, lt: end },
            },
            select: {
                id: true,
                reference: true,
                commercialId: true,
                cashRemis: true,
                omRemis: true,
                momoRemis: true,
                ecartStock: true,
                statut: true,
            },
        });

        const casses = await this.prisma.mouvementStock.findMany({
            where: {
                tenantId,
                type: TypeMouvement.CASSE_AVARIE,
                createdAt: { gte: start, lt: end },
                tourneeId: { not: null },
            },
            select: {
                quantite: true,
                tourneeId: true,
            },
        });

        const byCommercial = new Map(
            commerciaux.map((user) => [user.id, {
                commercialId: user.id,
                email: user.email,
                nbTournees: 0,
                nbTourneesValidees: 0,
                nbVentes: 0,
                chiffreAffaires: 0,
                margeBrute: 0,
                moyenneTicket: 0,
                cashRemis: 0,
                omRemis: 0,
                momoRemis: 0,
                ecartStockTotal: 0,
                nbCasses: 0,
                scorePerformance: 0,
            }]),
        );

        const tourneeToCommercial = new Map<string, string>();

        for (const tournee of tournees) {
            const current = byCommercial.get(tournee.commercialId);
            if (!current) continue;
            current.nbTournees += 1;
            if (tournee.statut === 'VALIDEE') current.nbTourneesValidees += 1;
            current.cashRemis += tournee.cashRemis || 0;
            current.omRemis += tournee.omRemis || 0;
            current.momoRemis += tournee.momoRemis || 0;
            current.ecartStockTotal += tournee.ecartStock || 0;
            tourneeToCommercial.set(tournee.id, tournee.commercialId);
        }

        for (const vente of ventes) {
            const commercialId =
                vente.tournee?.commercialId ||
                (vente.createur?.role === RoleUser.COMMERCIAL ? vente.createur.id : null);

            if (!commercialId || !byCommercial.has(commercialId)) continue;

            const current = byCommercial.get(commercialId)!;
            current.nbVentes += 1;
            current.chiffreAffaires += vente.total;

            const margeVente = vente.lignes.reduce((acc, ligne) => {
                const cout = ligne.quantite * (ligne.article.prixAchat || 0);
                return acc + (ligne.total - cout);
            }, 0);
            current.margeBrute += margeVente;
        }

        for (const casse of casses) {
            if (!casse.tourneeId) continue;
            const commercialId = tourneeToCommercial.get(casse.tourneeId);
            if (!commercialId || !byCommercial.has(commercialId)) continue;
            byCommercial.get(commercialId)!.nbCasses += casse.quantite;
        }

        const rows = Array.from(byCommercial.values()).map((row) => {
            row.moyenneTicket = row.nbVentes > 0
                ? Number((row.chiffreAffaires / row.nbVentes).toFixed(2))
                : 0;

            row.scorePerformance = Number((
                row.margeBrute +
                row.chiffreAffaires * 0.05 -
                row.ecartStockTotal * 1000 -
                row.nbCasses * 500
            ).toFixed(2));

            return row;
        });

        return rows.sort((a, b) => b.scorePerformance - a.scorePerformance);
    }

    async getPointMortMensuel(tenantId: string, siteId?: string, month?: string) {
        const { start, end } = getMonthRange(month);

        const ventes = await this.prisma.vente.findMany({
            where: {
                tenantId,
                statut: StatutVente.PAYE,
                date: { gte: start, lt: end },
                ...(siteId ? { siteId } : {}),
            },
            include: {
                lignes: {
                    include: { article: true },
                },
            },
        });

        const depenses = await this.prisma.depense.aggregate({
            where: {
                tenantId,
                createdAt: { gte: start, lt: end },
                ...(siteId ? { siteId } : {}),
            },
            _sum: { montant: true },
            _count: { id: true },
        });

        const chiffreAffaires = ventes.reduce((acc, vente) => acc + vente.total, 0);
        const coutVariable = ventes.reduce(
            (acc, vente) => acc + vente.lignes.reduce((sum, ligne) => sum + ligne.quantite * (ligne.article.prixAchat || 0), 0),
            0,
        );
        const margeBrute = chiffreAffaires - coutVariable;
        const chargesFixes = depenses._sum.montant || 0;
        const tauxMarge = chiffreAffaires > 0 ? margeBrute / chiffreAffaires : 0;
        const pointMortCA = tauxMarge > 0 ? chargesFixes / tauxMarge : 0;
        const atteint = chiffreAffaires >= pointMortCA && pointMortCA > 0;
        const restePourPointMort = Math.max(0, pointMortCA - chiffreAffaires);
        const surplusApresPointMort = Math.max(0, chiffreAffaires - pointMortCA);

        return {
            month: start.toISOString().slice(0, 7),
            chiffreAffaires: Number(chiffreAffaires.toFixed(2)),
            coutVariable: Number(coutVariable.toFixed(2)),
            margeBrute: Number(margeBrute.toFixed(2)),
            tauxMarge: Number((tauxMarge * 100).toFixed(2)),
            chargesFixes: Number(chargesFixes.toFixed(2)),
            pointMortCA: Number(pointMortCA.toFixed(2)),
            atteint,
            progression: pointMortCA > 0 ? Number(((chiffreAffaires / pointMortCA) * 100).toFixed(2)) : 0,
            restePourPointMort: Number(restePourPointMort.toFixed(2)),
            surplusApresPointMort: Number(surplusApresPointMort.toFixed(2)),
            nbVentes: ventes.length,
            nbDepenses: depenses._count.id || 0,
        };
    }
}
