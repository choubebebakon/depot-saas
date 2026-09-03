import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { RoleUser, StatutVente, TypeMouvement } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type ReportActor = {
  userId?: string;
  email?: string;
  role?: RoleUser;
  tenantId?: string;
  depotId?: string | null;
};

function getMonthRange(month?: string) {
  if (month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new BadRequestException('Le mois doit être au format YYYY-MM.');
  }
  const now = new Date();
  const base = month
    ? new Date(`${month}-01T00:00:00.000Z`)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
  return { start, end };
}

@Injectable()
export class RapportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveScope(actor: ReportActor | undefined, requestedDepotId?: string) {
    if (!actor?.tenantId || !actor.role) throw new ForbiddenException('Contexte utilisateur invalide.');

    if (actor.role === RoleUser.GERANT) {
      if (!actor.depotId) throw new ForbiddenException('Ce GERANT n\'est affecté à aucun dépôt.');
      if (requestedDepotId && requestedDepotId !== actor.depotId) {
        throw new ForbiddenException('Accès au dépôt demandé interdit.');
      }
      return { tenantId: actor.tenantId, depotId: actor.depotId };
    }

    if (!requestedDepotId) return { tenantId: actor.tenantId, depotId: undefined };

    const depot = await this.prisma.depot.findFirst({
      where: { id: requestedDepotId, tenantId: actor.tenantId, isArchived: false },
      select: { id: true },
    });
    if (!depot) throw new BadRequestException('Dépôt invalide, inexistant ou archivé.');

    return { tenantId: actor.tenantId, depotId: depot.id };
  }

  async getTopProduitsParMarge(actor: ReportActor | undefined, requestedDepotId?: string, month?: string) {
    const { tenantId, depotId } = await this.resolveScope(actor, requestedDepotId);
    const { start, end } = getMonthRange(month);

    const ventes = await this.prisma.vente.findMany({
      where: { tenantId, ...(depotId ? { depotId } : {}), statut: StatutVente.PAYE, date: { gte: start, lt: end } },
      include: { lignes: { include: { article: true } } },
    });

    const byArticle = new Map<string, any>();
    for (const vente of ventes) {
      for (const ligne of vente.lignes) {
        const current = byArticle.get(ligne.articleId) || {
          articleId: ligne.articleId, designation: ligne.article.designation, format: ligne.article.format,
          quantiteVendue: 0, chiffreAffaires: 0, coutAchat: 0, margeBrute: 0, tauxMarge: 0,
        };
        current.quantiteVendue += ligne.quantite;
        current.chiffreAffaires += ligne.total;
        current.coutAchat += ligne.quantite * (ligne.article.prixAchat || 0);
        current.margeBrute = current.chiffreAffaires - current.coutAchat;
        current.tauxMarge = current.chiffreAffaires > 0
          ? Number(((current.margeBrute / current.chiffreAffaires) * 100).toFixed(2)) : 0;
        byArticle.set(ligne.articleId, current);
      }
    }
    return Array.from(byArticle.values()).sort((a, b) => b.margeBrute - a.margeBrute).slice(0, 5);
  }

  async getPerformanceCommerciaux(actor: ReportActor | undefined, requestedDepotId?: string, month?: string) {
    const { tenantId, depotId } = await this.resolveScope(actor, requestedDepotId);
    const { start, end } = getMonthRange(month);

    const commerciaux = await this.prisma.user.findMany({
      where: { tenantId, role: RoleUser.COMMERCIAL, ...(depotId ? { depotId } : {}) },
      select: { id: true, email: true, role: true },
    });
    const ventes = await this.prisma.vente.findMany({
      where: { tenantId, ...(depotId ? { depotId } : {}), statut: StatutVente.PAYE, date: { gte: start, lt: end } },
      include: { lignes: { include: { article: true } }, tournee: { select: { commercialId: true, reference: true } }, createur: { select: { id: true, role: true } } },
    });
    const tournees = await this.prisma.tournee.findMany({
      where: { tenantId, ...(depotId ? { depotId } : {}), dateOuverture: { gte: start, lt: end } },
      select: { id: true, reference: true, commercialId: true, cashRemis: true, omRemis: true, momoRemis: true, ecartStock: true, statut: true },
    });
    const casses = await this.prisma.mouvementStock.findMany({
      where: { tenantId, ...(depotId ? { depotId } : {}), type: TypeMouvement.CASSE_AVARIE, createdAt: { gte: start, lt: end }, tourneeId: { not: null } },
      select: { quantite: true, tourneeId: true },
    });

    const byCommercial = new Map(commerciaux.map((user) => [user.id, {
      commercialId: user.id, email: user.email, nbTournees: 0, nbTourneesValidees: 0, nbVentes: 0,
      chiffreAffaires: 0, margeBrute: 0, moyenneTicket: 0, cashRemis: 0, omRemis: 0, momoRemis: 0,
      ecartStockTotal: 0, nbCasses: 0, scorePerformance: 0,
    }]));
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
      const commercialId = vente.tournee?.commercialId || (vente.createur?.role === RoleUser.COMMERCIAL ? vente.createur.id : null);
      if (!commercialId || !byCommercial.has(commercialId)) continue;
      const current = byCommercial.get(commercialId)!;
      current.nbVentes += 1;
      current.chiffreAffaires += vente.total;
      current.margeBrute += vente.lignes.reduce((acc, ligne) => acc + (ligne.total - ligne.quantite * (ligne.article.prixAchat || 0)), 0);
    }
    for (const casse of casses) {
      if (!casse.tourneeId) continue;
      const commercialId = tourneeToCommercial.get(casse.tourneeId);
      if (commercialId && byCommercial.has(commercialId)) byCommercial.get(commercialId)!.nbCasses += casse.quantite;
    }
    return Array.from(byCommercial.values()).map((row) => {
      row.moyenneTicket = row.nbVentes > 0 ? Number((row.chiffreAffaires / row.nbVentes).toFixed(2)) : 0;
      row.scorePerformance = Number((row.margeBrute + row.chiffreAffaires * 0.05 - row.ecartStockTotal * 1000 - row.nbCasses * 500).toFixed(2));
      return row;
    }).sort((a, b) => b.scorePerformance - a.scorePerformance);
  }

  async getPointMortMensuel(actor: ReportActor | undefined, requestedDepotId?: string, month?: string) {
    const { tenantId, depotId } = await this.resolveScope(actor, requestedDepotId);
    const { start, end } = getMonthRange(month);
    const ventes = await this.prisma.vente.findMany({
      where: { tenantId, ...(depotId ? { depotId } : {}), statut: StatutVente.PAYE, date: { gte: start, lt: end } },
      include: { lignes: { include: { article: true } } },
    });
    const depenses = await this.prisma.depense.aggregate({
      where: { tenantId, ...(depotId ? { depotId } : {}), createdAt: { gte: start, lt: end } },
      _sum: { montant: true }, _count: { id: true },
    });
    const chiffreAffaires = ventes.reduce((acc, vente) => acc + vente.total, 0);
    const coutVariable = ventes.reduce((acc, vente) => acc + vente.lignes.reduce((sum, ligne) => sum + ligne.quantite * (ligne.article.prixAchat || 0), 0), 0);
    const margeBrute = chiffreAffaires - coutVariable;
    const chargesFixes = depenses._sum.montant || 0;
    const tauxMarge = chiffreAffaires > 0 ? margeBrute / chiffreAffaires : 0;
    const pointMortCA = tauxMarge > 0 ? chargesFixes / tauxMarge : 0;
    const atteint = chiffreAffaires >= pointMortCA && pointMortCA > 0;
    return {
      month: start.toISOString().slice(0, 7), chiffreAffaires: Number(chiffreAffaires.toFixed(2)), coutVariable: Number(coutVariable.toFixed(2)),
      margeBrute: Number(margeBrute.toFixed(2)), tauxMarge: Number((tauxMarge * 100).toFixed(2)), chargesFixes: Number(chargesFixes.toFixed(2)),
      pointMortCA: Number(pointMortCA.toFixed(2)), atteint, progression: pointMortCA > 0 ? Number(((chiffreAffaires / pointMortCA) * 100).toFixed(2)) : 0,
      restePourPointMort: Number(Math.max(0, pointMortCA - chiffreAffaires).toFixed(2)), surplusApresPointMort: Number(Math.max(0, chiffreAffaires - pointMortCA).toFixed(2)),
      nbVentes: ventes.length, nbDepenses: depenses._count.id || 0,
    };
  }
}
