import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditSeverite, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_ACTIONS } from '../../audit/audit-actions.constants';
import { AuditActor } from '../../audit/audit-actor.util';

@Injectable()
export class DepotBoissonsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private toPositiveInt(value: unknown, fallback: number) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private requireString(value: unknown, field: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} est requis`);
    }
    return value.trim();
  }

  // ── Dashboard ──────────────────────────────────────────────────
  async getDashboardStats(tenantId: string, depotId?: string) {
    const depotFilter = depotId ? { depotId } : {};
    const whereTenant = { tenantId };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ventesJour,
      stockCritique,
      livraisons,
      caisseJour,
      clientsDebiteurs,
      tourneesActives,
      ventes30j,
      topArticles,
      evolutionStock,
    ] = await Promise.all([
      this.getVentesJour(tenantId, depotId, today),
      this.getStockCritique(tenantId, depotId),
      this.getLivraisonsEnCours(tenantId, depotId),
      this.getCaisseJour(tenantId, depotId, today),
      this.getClientsDebiteurs(tenantId, depotId),
      this.getTourneesActives(tenantId, depotId),
      this.getVentes30Jours(tenantId, depotId, today),
      this.getTopArticles(tenantId, depotId),
      this.getEvolutionStock(tenantId, depotId),
    ]);

    return {
      ventes_jour: ventesJour,
      stock_critique: stockCritique,
      livraisons_cours: livraisons,
      caisse_jour: caisseJour,
      clients_debiteurs: clientsDebiteurs,
      tournees_actives: tourneesActives,
      ventes_30j: ventes30j,
      top_articles: topArticles,
      evolution_stock: evolutionStock,
    };
  }

  private async getVentesJour(
    tenantId: string,
    depotId: string | undefined,
    today: Date,
  ) {
    const where: any = {
      tenantId,
      date: { gte: today },
      statut: { in: ['PAYE'] },
    };
    if (depotId) where.depotId = depotId;
    const ventes = await this.prisma.vente.findMany({
      where,
      select: { total: true },
    });
    return ventes.reduce((sum, v) => sum + v.total, 0);
  }

  private async getStockCritique(
    tenantId: string,
    depotId: string | undefined,
  ) {
    const where: any = { article: { tenantId } };
    if (depotId) where.depotId = depotId;
    const stocks = await this.prisma.stock.findMany({
      where,
      include: {
        article: { select: { designation: true, seuilCritique: true } },
      },
    });
    const critiques = stocks.filter(
      (s) => s.quantite <= s.article.seuilCritique,
    );
    return {
      count: critiques.length,
      articles: critiques.slice(0, 10).map((s) => ({
        designation: s.article.designation,
        quantite: s.quantite,
      })),
    };
  }

  private async getLivraisonsEnCours(
    tenantId: string,
    depotId: string | undefined,
  ) {
    const where: any = { tenantId, statut: { in: ['ENVOYE'] } };
    if (depotId) where.depotId = depotId;
    return this.prisma.commandeFournisseur.count({ where });
  }

  private async getCaisseJour(
    tenantId: string,
    depotId: string | undefined,
    today: Date,
  ) {
    const where: any = {
      tenantId,
      dateOuverture: { gte: today },
      estOuverte: true,
    };
    if (depotId) where.depotId = depotId;
    const sessions = await this.prisma.sessionCaisse.findMany({
      where,
      select: { fondInitial: true },
    });
    return sessions.reduce((sum, s) => sum + s.fondInitial, 0);
  }

  private async getClientsDebiteurs(
    tenantId: string,
    depotId: string | undefined,
  ) {
    const where: any = { tenantId, soldeCredit: { gt: 0 } };
    if (depotId) where.depotId = depotId;
    return this.prisma.client.count({ where });
  }

  private async getTourneesActives(
    tenantId: string,
    depotId: string | undefined,
  ) {
    const where: any = {
      tenantId,
      statut: { in: ['OUVERTE', 'CLOTURE_COMMERCIALE'] },
    };
    if (depotId) where.depotId = depotId;
    return this.prisma.tournee.count({ where });
  }

  private async getVentes30Jours(
    tenantId: string,
    depotId: string | undefined,
    today: Date,
  ) {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    const where: any = {
      tenantId,
      date: { gte: start },
      statut: { in: ['PAYE'] },
    };
    if (depotId) where.depotId = depotId;
    const ventes = await this.prisma.vente.findMany({
      where,
      orderBy: { date: 'asc' },
      select: { date: true, total: true },
    });
    const grouped: Record<string, number> = {};
    ventes.forEach((v) => {
      const key = v.date.toISOString().slice(0, 10);
      grouped[key] = (grouped[key] || 0) + v.total;
    });
    return Object.entries(grouped).map(([date, montant]) => ({
      date,
      montant,
    }));
  }

  private async getTopArticles(tenantId: string, depotId: string | undefined) {
    const where: any = { vente: { tenantId, statut: { in: ['PAYE'] } } };
    if (depotId) where.vente = { ...where.vente, depotId };
    const lignes = await this.prisma.ligneVente.groupBy({
      by: ['articleId'],
      _sum: { quantite: true },
      where,
      orderBy: { _sum: { quantite: 'desc' } },
      take: 10,
    });
    const articles = await this.prisma.article.findMany({
      where: { id: { in: lignes.map((l) => l.articleId) } },
      select: { id: true, designation: true },
    });
    const map = new Map(articles.map((a) => [a.id, a.designation]));
    return lignes.map((l) => ({
      nom: map.get(l.articleId) || 'Inconnu',
      quantite: l._sum.quantite || 0,
    }));
  }

  private async getEvolutionStock(
    tenantId: string,
    depotId: string | undefined,
  ) {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const where: any = { tenantId, createdAt: { gte: start } };
    if (depotId) where.depotId = depotId;
    const mouvements = await this.prisma.mouvementStock.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, type: true, quantite: true },
    });
    const grouped: Record<string, number> = {};
    mouvements.forEach((m) => {
      const key = m.createdAt.toISOString().slice(0, 10);
      const delta = m.type === 'ENTREE' ? m.quantite : -m.quantite;
      grouped[key] = (grouped[key] || 0) + delta;
    });
    let cumul = 0;
    return Object.entries(grouped).map(([date, delta]) => {
      cumul += delta;
      return { date, stock: cumul };
    });
  }

  // ── Articles ────────────────────────────────────────────────────
  async getArticles(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      famille?: string;
      stock?: string;
      depotId?: string;
    },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId };
    if (query.search)
      where.designation = { contains: query.search, mode: 'insensitive' };
    if (query.famille) where.famille = { nom: query.famille };
    if (query.stock === 'critique')
      where.stocks = {
        some: { quantite: { lte: this.prisma.stock.fields.seuilCritique } },
      };

    const [total, data] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          stocks: query.depotId ? { where: { depotId: query.depotId } } : true,
          famille: { select: { nom: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const articles = data.map((a) => ({
      id: a.id,
      designation: a.designation,
      format: a.format,
      famille: a.famille?.nom || '',
      marque: '',
      prix: a.prixVente,
      seuil: a.seuilCritique,
      quantite: a.stocks?.reduce((s, st) => s + st.quantite, 0) || 0,
    }));

    return { data: articles, total, page, limit };
  }

  async getArticle(tenantId: string, id: string) {
    return this.prisma.article.findFirst({
      where: { id, tenantId },
      include: { stocks: true, famille: true, conditionnements: true },
    });
  }

  async createArticle(tenantId: string, data: any) {
    return this.prisma.article.create({
      data: {
        designation: data.designation,
        format: data.format || '',
        prixVente: parseFloat(data.prix) || 0,
        seuilCritique: parseInt(data.seuil) || 10,
        familleId: data.familleId || undefined,
        photoUrl: data.photoUrl || undefined,
        tenantId,
      },
    });
  }

  async updateArticle(tenantId: string, id: string, data: any) {
    return this.prisma.article.updateMany({ where: { id, tenantId }, data });
  }

  async archiveArticle(tenantId: string, id: string) {
    return this.prisma.article.deleteMany({ where: { id, tenantId } });
  }

  async getStockHistory(tenantId: string, articleId: string) {
    return this.prisma.mouvementStock.findMany({
      where: { articleId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async entreStock(tenantId: string, data: any, actor: AuditActor) {
    const { articleId, quantite, depotId } = data;
    this.requireString(articleId, 'articleId');
    this.requireString(depotId, 'depotId');
    const qty = this.toPositiveInt(quantite, 0);
    if (!qty)
      throw new BadRequestException('quantite doit etre superieure a 0');

    const avant = await this.prisma.stock.findFirst({ where: { articleId, depotId } });
    await this.prisma.stock.upsert({
      where: { articleId_depotId: { articleId, depotId } },
      update: { quantite: { increment: qty } },
      create: { articleId, depotId, quantite: qty },
    });
    const motif = data.motif || 'Entrée manuelle';
    const mouvement = await this.prisma.mouvementStock.create({
      data: {
        type: 'ENTREE',
        quantite: qty,
        articleId,
        depotId,
        tenantId,
        motif,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.ENTREE_STOCK,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementStock',
        targetId: mouvement.id,
        description: `Entrée de stock de ${qty} unité(s) — motif : ${motif}`,
        valeurAvant: { quantite: avant?.quantite ?? 0 },
        valeurApres: { quantite: (avant?.quantite ?? 0) + qty },
        motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log ENTREE_STOCK:', err));

    return mouvement;
  }

  async sortieStock(tenantId: string, data: any, actor: AuditActor) {
    const { articleId, quantite, depotId } = data;
    this.requireString(articleId, 'articleId');
    this.requireString(depotId, 'depotId');
    const qty = this.toPositiveInt(quantite, 0);
    if (!qty)
      throw new BadRequestException('quantite doit etre superieure a 0');

    const avant = await this.prisma.stock.findFirst({ where: { articleId, depotId } });
    const updated = await this.prisma.stock.updateMany({
      where: { articleId, depotId, quantite: { gte: qty } },
      data: { quantite: { decrement: qty } },
    });
    if (!updated.count) throw new BadRequestException('Stock insuffisant');
    const motif = data.motif || 'Sortie manuelle';
    const mouvement = await this.prisma.mouvementStock.create({
      data: {
        type: 'SORTIE',
        quantite: qty,
        articleId,
        depotId,
        tenantId,
        motif,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.SORTIE_STOCK,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementStock',
        targetId: mouvement.id,
        description: `Sortie de stock de ${qty} unité(s) — motif : ${motif}`,
        valeurAvant: { quantite: avant?.quantite ?? 0 },
        valeurApres: { quantite: (avant?.quantite ?? 0) - qty },
        motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log SORTIE_STOCK:', err));

    return mouvement;
  }

  async transfertStock(tenantId: string, data: any, actor: AuditActor) {
    const articleId = data.articleId;
    const sourceDepotId = data.sourceDepotId || data.depotId;
    const destDepotId = data.depotDestination;
    this.requireString(articleId, 'articleId');
    this.requireString(sourceDepotId, 'sourceDepotId');
    this.requireString(destDepotId, 'depotDestination');
    const qty = this.toPositiveInt(data.quantite, 0);
    if (!qty)
      throw new BadRequestException('quantite doit etre superieure a 0');
    if (sourceDepotId === destDepotId) {
      throw new BadRequestException(
        'Le dépôt source et le dépôt destination doivent être différents',
      );
    }

    const transfert = await this.prisma.$transaction(async (tx) => {
      const t = await tx.transfertStock.create({
        data: {
          reference: `TRF-${Date.now()}`,
          statut: 'TERMINE',
          sourceDepotId,
          destDepotId,
          motif: data.motif,
          tenantId,
          lignes: {
            create: { articleId, quantite: qty },
          },
        },
      });

      const decremente = await tx.stock.updateMany({
        where: { articleId, depotId: sourceDepotId, quantite: { gte: qty } },
        data: { quantite: { decrement: qty } },
      });
      if (decremente.count === 0) {
        throw new BadRequestException('Stock insuffisant dans le dépôt source');
      }
      await tx.mouvementStock.create({
        data: {
          type: 'TRANSFERT_SORTIE',
          quantite: qty,
          articleId,
          depotId: sourceDepotId,
          tenantId,
          motif: data.motif || `Transfert ${t.reference} vers ${destDepotId}`,
        },
      });

      // AVANT CE CORRECTIF : le stock ne réapparaissait JAMAIS dans le
      // dépôt de destination. transfertStock() créait le TransfertStock
      // puis appelait uniquement sortieStock() côté source — l'incrément
      // côté destination était totalement absent. La marchandise
      // "disparaissait" du système à chaque transfert entre dépôts.
      await tx.stock.upsert({
        where: { articleId_depotId: { articleId, depotId: destDepotId } },
        update: { quantite: { increment: qty } },
        create: { articleId, depotId: destDepotId, quantite: qty },
      });
      await tx.mouvementStock.create({
        data: {
          type: 'TRANSFERT_ENTREE',
          quantite: qty,
          articleId,
          depotId: destDepotId,
          tenantId,
          motif: data.motif || `Transfert ${t.reference} depuis ${sourceDepotId}`,
        },
      });

      return t;
    });

    // Le flux actuel est synchrone en un seul appel (création + double
    // mouvement immédiats) — il n'existe aucune étape distincte de
    // "réception/validation du transfert" côté dépôt destinataire dans le
    // code actuel. TRANSFERT_VALIDE/TRANSFERT_ANNULE restent donc inutilisés
    // tant que ce flux en 2 étapes n'est pas construit (hors périmètre ici).
    await this.auditService
      .logEvent({
        tenantId,
        depotId: sourceDepotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.TRANSFERT_CREE,
        severite: AuditSeverite.INFO,
        targetType: 'TransfertStock',
        targetId: transfert.id,
        reference: transfert.reference,
        description: `Transfert ${transfert.reference} de ${qty} unité(s) — dépôt ${sourceDepotId} → ${destDepotId} (terminé immédiatement)`,
        valeurApres: {
          articleId,
          quantite: qty,
          sourceDepotId,
          destDepotId,
          statut: 'TERMINE',
        },
        motif: data.motif,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log TRANSFERT_CREE:', err));

    return transfert;
  }

  // ── Conditionnements ───────────────────────────────────────────
  async getConditionnements(tenantId: string) {
    return this.prisma.conditionnement.findMany({
      where: { tenantId },
      include: { article: { select: { designation: true } } },
    });
  }

  async createConditionnement(tenantId: string, data: any) {
    if (!data.articleId) {
      throw new BadRequestException('articleId est requis');
    }
    return this.prisma.conditionnement.create({ data: { ...data, tenantId } });
  }

  async updateConditionnement(tenantId: string, id: string, data: any) {
    return this.prisma.conditionnement.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteConditionnement(tenantId: string, id: string) {
    return this.prisma.conditionnement.deleteMany({ where: { id, tenantId } });
  }

  // ── Consignes ──────────────────────────────────────────────────
  async getConsignesClient(tenantId: string, clientId: string) {
    const typeConfigs = await this.prisma.typeConsigneConfig.findMany({
      where: { tenantId },
    });
    const portefeuille = await this.prisma.portefeuilleConsigne.findMany({
      where: { clientId },
      include: { typeConsigne: true },
    });
    const historique = await this.prisma.mouvementConsigne.findMany({
      where: { tenantId, vente: { clientId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const portefeuilleMap: Record<string, number> = {};
    portefeuille.forEach((p) => {
      portefeuilleMap[p.typeConsigne.type] = p.quantite;
    });
    const soldeTotal = portefeuille.reduce(
      (sum, p) => sum + p.quantite * p.typeConsigne.valeurXAF,
      0,
    );
    return { portefeuille: portefeuilleMap, soldeTotal, historique };
  }

  async sortirConsigne(tenantId: string, data: any) {
    const typeConfig = await this.prisma.typeConsigneConfig.findFirst({
      where: { tenantId, type: data.typeConsigne },
    });
    if (!typeConfig)
      throw new BadRequestException('Type consigne non configure');
    await this.prisma.portefeuilleConsigne.upsert({
      where: {
        clientId_typeConsigneId: {
          clientId: data.clientId,
          typeConsigneId: typeConfig.id,
        },
      },
      update: { quantite: { increment: parseInt(data.quantite) } },
      create: {
        clientId: data.clientId,
        typeConsigneId: typeConfig.id,
        quantite: parseInt(data.quantite),
        depotId: data.depotId,
      },
    });
    return this.prisma.mouvementConsigne.create({
      data: {
        quantite: parseInt(data.quantite),
        estSortie: true,
        typeConsigneId: typeConfig.id,
        tenantId,
        depotId: data.depotId,
      },
    });
  }

  async retourConsigne(tenantId: string, data: any) {
    const typeConfig = await this.prisma.typeConsigneConfig.findFirst({
      where: { tenantId, type: data.typeConsigne },
    });
    if (!typeConfig)
      throw new BadRequestException('Type consigne non configure');
    await this.prisma.portefeuilleConsigne.updateMany({
      where: {
        clientId: data.clientId,
        typeConsigneId: typeConfig.id,
        quantite: { gte: parseInt(data.quantite) },
      },
      data: { quantite: { decrement: parseInt(data.quantite) } },
    });
    return this.prisma.mouvementConsigne.create({
      data: {
        quantite: parseInt(data.quantite),
        estSortie: false,
        estRemboursementCash: false,
        typeConsigneId: typeConfig.id,
        tenantId,
        depotId: data.depotId,
      },
    });
  }

  async rembourserConsigne(tenantId: string, data: any) {
    const typeConfig = await this.prisma.typeConsigneConfig.findFirst({
      where: { tenantId },
    });
    if (!typeConfig)
      throw new BadRequestException('Type consigne non configure');
    const montant = Number.parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    return this.prisma.mouvementConsigne.create({
      data: {
        quantite: 1,
        estSortie: true,
        montantRembourse: montant,
        estRemboursementCash: true,
        typeConsigneId: typeConfig.id,
        tenantId,
        depotId: data.depotId,
      },
    });
  }

  async historiqueConsignes(tenantId: string, clientId: string) {
    return this.prisma.mouvementConsigne.findMany({
      where: { tenantId, vente: { clientId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ── Livraisons (CommandeFournisseur) ───────────────────────────
  async getLivraisons(
    tenantId: string,
    query: { page?: number; limit?: number; statut?: string; depotId?: string },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId, fournisseurId: { not: undefined } };
    if (query.statut) where.statut = query.statut;
    if (query.depotId) where.depotId = query.depotId;
    const [total, data] = await Promise.all([
      this.prisma.receptionFournisseur.count({ where }),
      this.prisma.receptionFournisseur.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          fournisseur: { select: { nom: true } },
          lignes: { include: { article: { select: { designation: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit };
  }

  async createLivraison(tenantId: string, data: any) {
    this.requireString(data.fournisseurId, 'fournisseurId');
    this.requireString(data.depotId, 'depotId');
    return this.prisma.receptionFournisseur.create({
      data: {
        reference: `REC-${Date.now()}`,
        statut: 'EN_COURS',
        fournisseurId: data.fournisseurId,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async deleteLivraison(tenantId: string, id: string) {
    return this.prisma.receptionFournisseur.deleteMany({
      where: { id, tenantId },
    });
  }

  // ── Tournées ───────────────────────────────────────────────────
  async getTournees(
    tenantId: string,
    query: { page?: number; limit?: number; depotId?: string },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId };
    if (query.depotId) where.depotId = query.depotId;
    const [total, data] = await Promise.all([
      this.prisma.tournee.count({ where }),
      this.prisma.tournee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          commercial: { select: { nom: true } },
          tricycle: { select: { nom: true } },
          lignesChargement: {
            include: { article: { select: { designation: true } } },
          },
        },
        orderBy: { dateOuverture: 'desc' },
      }),
    ]);
    const formatted = data.map((t) => ({
      id: t.id,
      commercial: t.commercial ? { nom: t.commercial.nom } : null,
      tricycle: t.tricycle?.nom || '',
      statut: t.statut,
      date: t.dateOuverture,
      notes: t.noteCloture,
      articlesCharges: t.lignesChargement.reduce(
        (s, l) => s + l.quantiteChargee,
        0,
      ),
      articlesVendus: t.lignesChargement.reduce(
        (s, l) => s + l.quantiteVendue,
        0,
      ),
      retours: t.lignesChargement.reduce((s, l) => s + l.quantiteRetour, 0),
      montant: t.cashRemis + t.omRemis + t.momoRemis,
    }));
    return { data: formatted, total, page, limit };
  }

  async createTournee(tenantId: string, data: any) {
    this.requireString(data.depotId, 'depotId');
    this.requireString(data.tricycleId, 'tricycleId');
    this.requireString(data.commercialId, 'commercialId');
    return this.prisma.tournee.create({
      data: {
        reference: `TRN-${Date.now()}`,
        statut: 'OUVERTE',
        dateOuverture: data.date ? new Date(data.date) : new Date(),
        depotId: data.depotId,
        tricycleId: data.tricycleId,
        commercialId: data.commercialId,
        tenantId,
      },
    });
  }

  async demarrerTournee(tenantId: string, id: string) {
    return this.prisma.tournee.updateMany({
      where: { id, tenantId },
      data: { statut: 'OUVERTE' },
    });
  }

  async cloturerTournee(tenantId: string, id: string, data: any) {
    return this.prisma.tournee.updateMany({
      where: { id, tenantId },
      data: {
        statut: 'CLOTURE_COMMERCIALE',
        dateCloture: new Date(),
        cashRemis: data.montant || 0,
      },
    });
  }

  async chargerArticlesTournee(tenantId: string, id: string, data: any) {
    const articles = data.articles || [];
    for (const ligne of articles) {
      await this.prisma.ligneChargement.create({
        data: {
          tourneeId: id,
          articleId: ligne.articleId,
          quantiteChargee: parseInt(ligne.quantite),
        },
      });
    }
    return { success: true };
  }

  async getRecapTournee(tenantId: string, id: string) {
    const tournee = await this.prisma.tournee.findFirst({
      where: { id, tenantId },
      include: {
        lignesChargement: {
          include: { article: { select: { designation: true } } },
        },
        ventes: { select: { total: true } },
      },
    });
    if (!tournee) return null;
    const articlesCharges = tournee.lignesChargement.reduce(
      (s, l) => s + l.quantiteChargee,
      0,
    );
    const articlesVendus = tournee.lignesChargement.reduce(
      (s, l) => s + l.quantiteVendue,
      0,
    );
    const retours = tournee.lignesChargement.reduce(
      (s, l) => s + l.quantiteRetour,
      0,
    );
    const montant = tournee.ventes.reduce((s, v) => s + v.total, 0);
    return { articlesCharges, articlesVendus, retours, montant };
  }

  // ── Clients ────────────────────────────────────────────────────
  async getClients(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      debiteur?: string;
      depotId?: string;
    },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId };
    if (query.search)
      where.OR = [
        { nom: { contains: query.search, mode: 'insensitive' } },
        { telephone: { contains: query.search } },
      ];
    if (query.debiteur === 'true') where.soldeCredit = { gt: 0 };
    if (query.depotId) where.depotId = query.depotId;
    const [total, data] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit };
  }

  async getClient(tenantId: string, id: string) {
    return this.prisma.client.findFirst({ where: { id, tenantId } });
  }

  async createClient(tenantId: string, data: any) {
    return this.prisma.client.create({
      data: {
        nom: data.nom,
        telephone: data.telephone,
        adresse: data.adresse,
        soldeCredit: parseFloat(data.soldeCredit) || 0,
        depotId: data.depotId,
        tenantId,
      },
    });
  }

  async updateClient(tenantId: string, id: string, data: any) {
    const validData: any = {};
    if (data.nom !== undefined) validData.nom = data.nom;
    if (data.telephone !== undefined) validData.telephone = data.telephone;
    if (data.adresse !== undefined) validData.adresse = data.adresse;
    if (data.plafondCredit !== undefined)
      validData.plafondCredit = parseFloat(data.plafondCredit) || 0;
    if (data.depotId !== undefined) validData.depotId = data.depotId;
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return this.prisma.client.update({
      where: { id },
      data: validData,
    });
  }

  async payerDette(tenantId: string, clientId: string, data: any, actor: AuditActor) {
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new NotFoundException('Client introuvable');
    const result = await this.prisma.client.updateMany({
      where: { id: clientId, tenantId },
      data: { soldeCredit: { decrement: montant } },
    });
    if (result.count === 0) {
      throw new NotFoundException('Client introuvable');
    }
    const dette = await this.prisma.detteClient.create({
      data: {
        montant,
        montantPaye: montant,
        statut: 'SOLDEE',
        clientId,
        tenantId,
        depotId: data.depotId,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.DETTE_CLIENT_REGLEE,
        severite: AuditSeverite.INFO,
        targetType: 'Client',
        targetId: clientId,
        reference: client.nom,
        description: `Dette réglée par le client "${client.nom}" (${montant} FCFA)`,
        valeurAvant: { soldeCredit: client.soldeCredit },
        valeurApres: { soldeCredit: client.soldeCredit - montant },
        montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log DETTE_CLIENT_REGLEE:', err));

    return dette;
  }

  async historiqueAchats(tenantId: string, clientId: string, query: any) {
    const ventes = await this.prisma.vente.findMany({
      where: { clientId, tenantId },
      orderBy: { date: 'desc' },
      take: parseInt(query.limit) || 50,
      select: { id: true, date: true, total: true },
    });
    return {
      data: ventes.map((v) => ({
        date: v.date,
        montant: v.total,
        type: 'Vente',
      })),
    };
  }

  // ── Fournisseurs ───────────────────────────────────────────────
  async getFournisseurs(
    tenantId: string,
    query: { page?: number; limit?: number; depotId?: string },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId };
    if (query.depotId) where.depotId = query.depotId;
    const [total, data] = await Promise.all([
      this.prisma.fournisseur.count({ where }),
      this.prisma.fournisseur.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const withDette = data.map((f) => ({ ...f, dette: f.solde || 0 }));
    return { data: withDette, total, page, limit };
  }

  async getFournisseur(tenantId: string, id: string) {
    return this.prisma.fournisseur.findFirst({ where: { id, tenantId } });
  }

  async createFournisseur(tenantId: string, data: any) {
    return this.prisma.fournisseur.create({
      data: { nom: data.nom, telephone: data.telephone, tenantId },
    });
  }

  async updateFournisseur(tenantId: string, id: string, data: any) {
    return this.prisma.fournisseur.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async passerCommandeFournisseur(tenantId: string, data: any) {
    this.requireString(data.fournisseurId, 'fournisseurId');
    this.requireString(data.depotId, 'depotId');
    this.requireString(data.userId, 'userId');
    return this.prisma.commandeFournisseur.create({
      data: {
        reference: `CMD-${Date.now()}`,
        statut: 'ENVOYE',
        fournisseurId: data.fournisseurId,
        depotId: data.depotId,
        tenantId,
        createurId: data.userId,
      },
    });
  }

  async receptionnerLivraison(tenantId: string, id: string, data: any, actor: AuditActor) {
    const fournisseur = await this.prisma.fournisseur.findFirst({ where: { id, tenantId } });
    const reception = await this.prisma.receptionFournisseur.create({
      data: {
        reference: `REC-${Date.now()}`,
        statut: 'VALIDEE',
        fournisseurId: id,
        depotId: data.depotId,
        tenantId,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.RECEPTION_VALIDEE,
        severite: AuditSeverite.INFO,
        targetType: 'ReceptionFournisseur',
        targetId: reception.id,
        reference: reception.reference,
        description: `Réception ${reception.reference} validée${fournisseur ? ` — fournisseur "${fournisseur.nom}"` : ''}`,
        valeurApres: { statut: 'VALIDEE', fournisseurId: id },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log RECEPTION_VALIDEE:', err));

    return reception;
  }

  async reglerDetteFournisseur(
    tenantId: string,
    fournisseurId: string,
    data: any,
    actor: AuditActor,
  ) {
    const montant = parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id: fournisseurId, tenantId },
    });
    if (!fournisseur) throw new NotFoundException('Fournisseur introuvable');

    const result = await this.prisma.fournisseur.updateMany({
      where: { id: fournisseurId, tenantId },
      data: { solde: { decrement: montant } },
    });
    if (result.count === 0) {
      // Auparavant ce cas passait silencieusement (ni erreur, ni confirmation
      // que le solde a vraiment été débité) — même défaut que celui déjà
      // corrigé ailleurs sur les fermetures de caisse.
      throw new NotFoundException('Fournisseur introuvable');
    }

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId ?? actor.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.DETTE_FOURNISSEUR_REGLEE,
        severite: AuditSeverite.INFO,
        targetType: 'Fournisseur',
        targetId: fournisseurId,
        reference: fournisseur.nom,
        description: `Dette réglée auprès du fournisseur "${fournisseur.nom}" (${montant} FCFA)`,
        valeurAvant: { solde: fournisseur.solde },
        valeurApres: { solde: (fournisseur.solde || 0) - montant },
        montant: -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log DETTE_FOURNISSEUR_REGLEE:', err));

    return { success: true };
  }

  async historiqueCommandes(tenantId: string, fournisseurId: string) {
    const commandes = await this.prisma.commandeFournisseur.findMany({
      where: { fournisseurId, tenantId },
      orderBy: { dateCommande: 'desc' },
      take: 50,
    });
    const receptions = await this.prisma.receptionFournisseur.findMany({
      where: { fournisseurId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      data: [
        ...commandes.map((c) => ({
          date: c.dateCommande,
          articles: c.reference,
          statut: c.statut,
        })),
        ...receptions.map((r) => ({
          date: r.createdAt,
          articles: r.reference,
          statut: r.statut,
        })),
      ],
    };
  }

  // ── Ventes ─────────────────────────────────────────────────────
  async getVentes(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      depotId?: string;
    },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId };
    if (query.depotId) where.depotId = query.depotId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    const [total, data] = await Promise.all([
      this.prisma.vente.count({ where }),
      this.prisma.vente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { client: { select: { nom: true } }, lignes: true },
        orderBy: { date: 'desc' },
      }),
    ]);
    const formatted = data.map((v) => ({
      id: v.id,
      reference: v.reference,
      date: v.date,
      total: v.total,
      modePaiement: v.modePaiement,
      statut: v.statut,
      client: v.client,
      nbArticles: v.lignes.reduce((s, l) => s + l.quantite, 0),
    }));
    return { data: formatted, total, page, limit };
  }

  async getVente(tenantId: string, id: string) {
    return this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        lignes: { include: { article: { select: { designation: true } } } },
      },
    });
  }

  async createVente(tenantId: string, data: any, actor: AuditActor) {
    this.requireString(data.depotId, 'depotId');
    if (!Array.isArray(data.articles) || data.articles.length === 0) {
      throw new BadRequestException('articles est requis');
    }
    const total = data.articles.reduce(
      (sum: number, a: any) => sum + parseFloat(a.prixUnitaire) * a.quantite,
      0,
    );
    if (!Number.isFinite(total) || total <= 0)
      throw new BadRequestException('total vente invalide');

    const vente = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vente.create({
        data: {
          reference: `VNT-${Date.now()}`,
          total,
          statut: 'PAYE',
          modePaiement: data.modePaiement || 'CASH',
          tenantId,
          depotId: data.depotId,
          clientId: data.clientId,
          createurId: actor.userId,
          date: new Date(),
          lignes: {
            create: data.articles.map((a: any) => ({
              articleId: a.articleId,
              quantite: a.quantite,
              prix: parseFloat(a.prixUnitaire),
              total: parseFloat(a.prixUnitaire) * a.quantite,
            })),
          },
        },
      });
      for (const article of data.articles) {
        const articleId = article.articleId;
        const qte = article.quantite;

        const stock = await tx.stock.findFirst({
          where: { articleId, depotId: data.depotId },
        });
        if (!stock) {
          throw new BadRequestException(`Stock introuvable pour l'article ${articleId}`);
        }
        if (stock.quantite < qte) {
          throw new BadRequestException(`Stock insuffisant pour l'article ${articleId}`);
        }

        const decremente = await tx.stock.updateMany({
          where: { articleId, depotId: data.depotId, quantite: { gte: qte } },
          data: { quantite: { decrement: qte } },
        });
        if (decremente.count === 0) {
          throw new ConflictException(
            `Stock modifié entre-temps pour l'article ${articleId}, veuillez réessayer`,
          );
        }
        await tx.mouvementStock.create({
          data: {
            type: 'SORTIE_VENTE',
            quantite: qte,
            articleId,
            depotId: data.depotId,
            tenantId,
            motif: `Vente ${v.reference}`,
          },
        });
      }
      return v;
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_CREEE,
        severite: AuditSeverite.INFO,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} créée (${data.articles.length} article(s), ${vente.total} FCFA)`,
        valeurApres: {
          total: vente.total,
          modePaiement: vente.modePaiement,
          nbArticles: data.articles.length,
        },
        montant: vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log VENTE_CREEE:', err));

    return vente;
  }

  async annulerVente(tenantId: string, id: string, motif: string | undefined, actor: AuditActor) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });
    if (!vente) throw new NotFoundException('Vente introuvable');
    if (vente.statut === 'ANNULE')
      throw new BadRequestException('Cette vente est déjà annulée');

    const motifFinal = motif || 'Annulation manuelle';

    await this.prisma.$transaction(async (tx) => {
      await tx.vente.update({
        where: { id },
        data: { statut: 'ANNULE', motifAnnulation: motifFinal },
      });
      for (const ligne of vente.lignes) {
        await tx.stock.updateMany({
          where: { articleId: ligne.articleId, depotId: vente.depotId },
          data: { quantite: { increment: ligne.quantite } },
        });
      }
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: vente.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.VENTE_ANNULEE,
        severite: AuditSeverite.CRITIQUE,
        targetType: 'Vente',
        targetId: vente.id,
        reference: vente.reference,
        description: `Vente ${vente.reference} annulée (${vente.total} FCFA) — motif : ${motifFinal}`,
        valeurAvant: { statut: vente.statut, total: vente.total },
        valeurApres: { statut: 'ANNULE', motif: motifFinal },
        motif: motifFinal,
        montant: -vente.total,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log VENTE_ANNULEE:', err));

    return { success: true };
  }

  async imprimerTicket(tenantId: string, id: string) {
    const vente = await this.getVente(tenantId, id);
    return vente;
  }

  // ── Caisse ─────────────────────────────────────────────────────
  async getCaisseStatut(tenantId: string, depotId?: string) {
    const where: any = { tenantId, estOuverte: true };
    if (depotId) where.depotId = depotId;
    const session = await this.prisma.sessionCaisse.findFirst({
      where,
      include: { mouvements: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    const mouvements = session?.mouvements || [];
    const entreesJour = mouvements
      .filter((m) => m.type.startsWith('ENCAISSEMENT'))
      .reduce((s, m) => s + m.montant, 0);
    const sortiesJour = mouvements
      .filter((m) => m.type.startsWith('DECAISSEMENT'))
      .reduce((s, m) => s + m.montant, 0);
    return {
      statut: session ? 'OUVERTE' : 'FERMEE',
      solde: session ? session.fondInitial + entreesJour - sortiesJour : 0,
      entreesJour,
      sortiesJour,
      mouvements,
    };
  }

  async ouvrirCaisse(tenantId: string, data: any, actor: AuditActor) {
    this.requireString(data.depotId, 'depotId');
    this.requireString(data.userId, 'userId');
    const existing = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (existing) throw new ConflictException('Une caisse est deja ouverte');
    const session = await this.prisma.sessionCaisse.create({
      data: {
        fondInitial: parseFloat(data.montantInitial) || 0,
        depotId: data.depotId,
        userId: data.userId,
        tenantId,
        estOuverte: true,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.CAISSE_OUVERTE,
        severite: AuditSeverite.INFO,
        targetType: 'SessionCaisse',
        targetId: session.id,
        description: `Caisse ouverte avec un fond initial de ${session.fondInitial} FCFA`,
        valeurApres: { fondInitial: session.fondInitial },
        montant: session.fondInitial,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log CAISSE_OUVERTE:', err));

    return session;
  }

  async fermerCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) {
      throw new BadRequestException('Aucune session de caisse ouverte à fermer.');
    }

    const result = await this.prisma.sessionCaisse.updateMany({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
      data: {
        estOuverte: false,
        dateCloture: new Date(),
        fondFinal: data.fondFinal,
        ecart: data.ecart,
      },
    });
    if (result.count === 0) {
      throw new BadRequestException('Aucune session de caisse ouverte à fermer.');
    }

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.CAISSE_FERMEE,
        severite: data.ecart ? AuditSeverite.ATTENTION : AuditSeverite.INFO,
        targetType: 'SessionCaisse',
        targetId: session.id,
        description: `Caisse fermée — fond final ${data.fondFinal ?? 0} FCFA${
          data.ecart ? `, écart de ${data.ecart} FCFA` : ''
        }`,
        valeurAvant: { fondInitial: session.fondInitial, estOuverte: true },
        valeurApres: {
          fondFinal: data.fondFinal ?? null,
          ecart: data.ecart ?? null,
          estOuverte: false,
        },
        montant: data.ecart ?? null,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log CAISSE_FERMEE:', err));

    return result;
  }

  async mouvementCaisse(tenantId: string, data: any, actor: AuditActor) {
    const session = await this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId: data.depotId, estOuverte: true },
    });
    if (!session) throw new BadRequestException('Caisse non ouverte');

    const montant = parseFloat(data.montant);
    const estEntree = data.typeMouvement === 'ENTREE';
    const motif = data.motif || 'Mouvement';

    const mouvement = await this.prisma.mouvementCaisse.create({
      data: {
        type: estEntree ? 'ENCAISSEMENT_VENTE' : 'DECAISSEMENT_DEPENSE',
        montant,
        motif,
        sessionId: session.id,
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: estEntree ? AUDIT_ACTIONS.ENTREE_CAISSE : AUDIT_ACTIONS.SORTIE_CAISSE,
        severite: AuditSeverite.INFO,
        targetType: 'MouvementCaisse',
        targetId: mouvement.id,
        description: `${estEntree ? 'Entrée' : 'Sortie'} de caisse de ${montant} FCFA — motif : ${motif}`,
        valeurApres: { montant, motif },
        motif,
        montant: estEntree ? montant : -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log mouvement caisse:', err));

    return mouvement;
  }

  async rapportJournalier(tenantId: string, depotId?: string) {
    return this.getCaisseStatut(tenantId, depotId);
  }

  // ── Dépenses ───────────────────────────────────────────────────
  async getDepenses(
    tenantId: string,
    query: { page?: number; limit?: number; depotId?: string },
  ) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 20);
    const where: any = { tenantId };
    if (query.depotId) where.depotId = query.depotId;
    const [total, data] = await Promise.all([
      this.prisma.depense.count({ where }),
      this.prisma.depense.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit };
  }

  async createDepense(tenantId: string, data: any, actor: AuditActor) {
    const montant = Number.parseFloat(data.montant);
    if (!Number.isFinite(montant) || montant <= 0)
      throw new BadRequestException('montant invalide');
    const depense = await this.prisma.depense.create({
      data: {
        categorie: data.categorie || 'Autre',
        montant,
        motif: data.motif || '',
        depotId: data.depotId,
        tenantId,
        createdAt: data.date ? new Date(data.date) : new Date(),
      },
    });

    await this.auditService
      .logEvent({
        tenantId,
        depotId: data.depotId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.DEPENSE_ENREGISTREE,
        severite: AuditSeverite.INFO,
        targetType: 'Depense',
        targetId: depense.id,
        description: `Dépense enregistrée : ${data.motif || 'sans libellé'} (${montant} FCFA)`,
        valeurApres: { montant, categorie: depense.categorie, motif: data.motif },
        motif: data.motif,
        montant: -montant,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) => console.error('[Audit] Échec log DEPENSE_ENREGISTREE:', err));

    return depense;
  }

  async deleteDepense(tenantId: string, id: string) {
    return this.prisma.depense.deleteMany({ where: { id, tenantId } });
  }

  // ── Rapports ───────────────────────────────────────────────────
  async getRapport(
    tenantId: string,
    type: string,
    query: { dateDebut?: string; dateFin?: string; depotId?: string },
  ) {
    const startDate = query.dateDebut
      ? new Date(query.dateDebut)
      : new Date(new Date().setDate(1));
    const endDate = query.dateFin ? new Date(query.dateFin) : new Date();
    const whereDate = { gte: startDate, lte: endDate };
    const where: any = { tenantId, date: whereDate };
    if (query.depotId) where.depotId = query.depotId;

    switch (type) {
      case 'ventes': {
        const ventes = await this.prisma.vente.findMany({
          where,
          orderBy: { date: 'desc' },
        });
        return ventes.map((v) => ({
          Date: v.date.toISOString().slice(0, 10),
          Référence: v.reference,
          Total: v.total,
          Paiement: v.modePaiement,
          Statut: v.statut,
        }));
      }
      case 'stock': {
        const stocks = await this.prisma.stock.findMany({
          where: { article: { tenantId } },
          include: { article: { select: { designation: true } } },
        });
        return stocks.map((s) => ({
          Article: s.article.designation,
          Quantité: s.quantite,
          Dépôt: s.depotId,
        }));
      }
      case 'clients_debiteurs': {
        const clients = await this.prisma.client.findMany({
          where: { ...where, soldeCredit: { gt: 0 } },
          orderBy: { soldeCredit: 'desc' },
        });
        return clients.map((c) => ({
          Client: c.nom,
          Téléphone: c.telephone,
          Dette: c.soldeCredit,
        }));
      }
      case 'depenses': {
        const depenses = await this.prisma.depense.findMany({
          where: { ...where, tenantId },
          orderBy: { createdAt: 'desc' },
        });
        return depenses.map((d) => ({
          Date: d.createdAt.toISOString().slice(0, 10),
          Catégorie: d.categorie,
          Montant: d.montant,
          Motif: d.motif,
        }));
      }
      default:
        return [];
    }
  }

  async exporterRapport(
    tenantId: string,
    type: string,
    format: string,
    query: any,
  ) {
    return this.getRapport(tenantId, type, query);
  }
}