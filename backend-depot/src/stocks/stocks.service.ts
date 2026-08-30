import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TypeMouvement } from '@prisma/client';
import { SignalerAvarieDto } from './dto/signaler-avarie.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StocksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException(
        'depotId est obligatoire pour isoler les donnees par depot.',
      );
    }

    return depotId;
  }

  // 1. Liste des stocks
  async obtenirTousLesStocks(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    return this.prisma.stock.findMany({
      where: {
        depotId: selectedDepotId,
        depot: { tenantId },
      },
      include: {
        article: true,
        depot: true,
      },
      orderBy: { article: { designation: 'asc' } },
    });
  }

  // 2. Statistiques (Valeur stock, Ruptures, Critiques)
  async obtenirStats(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    const stocks = await this.prisma.stock.findMany({
      where: { depotId: selectedDepotId, depot: { tenantId } },
      include: { article: true },
    });

    const totalArticles = stocks.length;
    const enRupture = stocks.filter((s) => s.quantite <= 0).length;

    const critiques = stocks.filter((s) => {
      const seuil = s.seuilCritique ?? s.article.seuilCritique ?? 0;
      return s.quantite > 0 && s.quantite <= seuil;
    }).length;

    const valeurStock = stocks.reduce((acc, s) => {
      return acc + s.quantite * (s.article.prixAchat || 0);
    }, 0);

    return { totalArticles, enRupture, critiques, valeurStock };
  }

  // 3. Alertes critiques
  async obtenirAlertes(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    const stocks = await this.prisma.stock.findMany({
      where: { depotId: selectedDepotId, depot: { tenantId } },
      include: { article: true },
    });

    return stocks.filter((s) => {
      const seuil = s.seuilCritique ?? s.article.seuilCritique ?? 0;
      return s.quantite <= seuil;
    });
  }

  // 4. Ajustement d'inventaire
  async ajusterStock(data: {
    articleId: string;
    depotId: string;
    nouvelleQuantite: number;
    tenantId: string;
    seuilCritique?: number;
    motif?: string;
    actor: { userId: string; email: string; role: string };
  }) {
    return this.prisma.$transaction(async (tx) => {
      const stockActuel = await tx.stock.findUnique({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.depotId,
          },
        },
        include: { article: true },
      });

      const ancienneQt = stockActuel?.quantite || 0;
      const difference = data.nouvelleQuantite - ancienneQt;

      const stockMisAJour = await tx.stock.upsert({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.depotId,
          },
        },
        update: {
          quantite: data.nouvelleQuantite,
          ...(data.seuilCritique !== undefined
            ? { seuilCritique: data.seuilCritique }
            : {}),
        },
        create: {
          articleId: data.articleId,
          depotId: data.depotId,
          quantite: data.nouvelleQuantite,
          seuilCritique: data.seuilCritique,
        },
      });

      if (difference !== 0) {
        await tx.mouvementStock.create({
          data: {
            type: TypeMouvement.AJUSTEMENT_INVENTAIRE,
            quantite: Math.abs(difference),
            motif: data.motif || 'Ajustement manuel',
            articleId: data.articleId,
            depotId: data.depotId,
            tenantId: data.tenantId,
          },
        });

        // Audit Avancé
        await this.auditService.logEvent({
          tenantId: data.tenantId,
          actorUserId: data.actor.userId,
          actorEmail: data.actor.email,
          actorRole: data.actor.role,
          action: 'AJUSTEMENT_STOCK',
          targetType: 'STOCK',
          targetId: stockMisAJour.id,
          reference: stockActuel?.article?.designation || data.articleId,
          description: `Ajustement stock de ${ancienneQt} vers ${data.nouvelleQuantite} (Diff: ${difference})`,
          metadata: { ...data, ancienneQt, difference },
        });
      }

      return stockMisAJour;
    });
  }

  // 5. Transfert entre dépôts
  async transfererStock(data: {
    articleId: string;
    sourceDepotId: string;
    destDepotId: string;
    quantite: number;
    tenantId: string;
    motif?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.sourceDepotId,
          },
        },
        data: { quantite: { decrement: data.quantite } },
      });

      await tx.stock.upsert({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.destDepotId,
          },
        },
        update: { quantite: { increment: data.quantite } },
        create: {
          articleId: data.articleId,
          depotId: data.destDepotId,
          quantite: data.quantite,
        },
      });

      await tx.mouvementStock.createMany({
        data: [
          {
            type: TypeMouvement.TRANSFERT_SORTIE,
            quantite: data.quantite,
            motif: data.motif || `Vers Dépôt ${data.destDepotId}`,
            articleId: data.articleId,
            depotId: data.sourceDepotId,
            tenantId: data.tenantId,
          },
          {
            type: TypeMouvement.TRANSFERT_ENTREE,
            quantite: data.quantite,
            motif: data.motif || `Depuis Dépôt ${data.sourceDepotId}`,
            articleId: data.articleId,
            depotId: data.destDepotId,
            tenantId: data.tenantId,
          },
        ],
      });

      return { success: true };
    });
  }

  // 6. Historique avec filtres
  async obtenirMouvements(tenantId: string, filters: any) {
    const selectedDepotId = this.requireDepotId(filters.depotId);

    return this.prisma.mouvementStock.findMany({
      where: {
        tenantId,
        depotId: selectedDepotId,
        ...(filters.articleId ? { articleId: filters.articleId } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      include: { article: true, depot: true, tournee: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // 7. Signalement d'Avarie (Casse/Perte)
  async signalerAvarie(data: SignalerAvarieDto, actor: any) {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.update({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.depotId,
          },
        },
        data: { quantite: { decrement: data.quantite } },
        include: { article: true },
      });

      await tx.mouvementStock.create({
        data: {
          type: TypeMouvement.CASSE_AVARIE,
          quantite: data.quantite,
          motif: data.motif,
          photoUrl: data.photoUrl,
          articleId: data.articleId,
          depotId: data.depotId,
          tenantId: data.tenantId,
        },
      });

      // Audit Avancé
      await this.auditService.logEvent({
        tenantId: data.tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SIGNALEMENT_AVARIE',
        targetType: 'STOCK',
        targetId: stock.id,
        reference: stock.article.designation,
        description: `Signalement d'avarie : ${data.quantite} unités perdues. Motif: ${data.motif}`,
        metadata: { ...data },
      });

      return stock;
    });
  }

  // 8. GET /:id — Détail d'un article (Phase 4)
  async findOne(tenantId: string, id: string) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, depot: { tenantId } },
      include: { article: true, depot: true, tricycle: true },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    return stock;
  }

  // 9. PUT /:id — Mise à jour d'un article (Phase 4)
  async update(tenantId: string, id: string, dto: UpdateStockDto) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, depot: { tenantId } },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    return this.prisma.stock.update({
      where: { id },
      data: { ...dto },
    });
  }

  // 10. GET /config — Configuration du module stock (Phase 4)
  async getConfig(tenantId: string) {
    // Retourne une configuration par défaut pour le tenant
    // Peut être étendu pour inclure une table StockConfig si nécessaire
    return {
      alertesStockBas: true,
      seuilAlerteDefaut: 10,
      autoriserAjustement: true,
      autoriserTransfert: true,
      trackingLots: false,
    };
  }

  // 11. GET /caisse — État de la caisse du jour (Phase 4)
  async getCaisse(tenantId: string, depotId: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ventes = await this.prisma.vente.aggregate({
      where: {
        tenantId,
        depotId: selectedDepotId,
        date: { gte: today },
        statut: 'PAYE',
      },
      _sum: { total: true },
      _count: true,
    });

    return {
      montantTotal: ventes._sum?.total ?? 0,
      nombreVentes: ventes._count,
      date: today,
    };
  }

  // === GESTION DES LOTS ===

  async getLots(tenantId: string, articleId?: string, depotId?: string) {
    const where: any = { tenantId };
    if (articleId) where.articleId = articleId;
    if (depotId) where.depotId = depotId;

    return this.prisma.lotStock.findMany({
      where,
      include: {
        article: true,
        depot: true,
      },
      orderBy: { dlc: 'asc' },
    });
  }

  async getLotById(tenantId: string, lotId: string) {
    const lot = await this.prisma.lotStock.findFirst({
      where: { id: lotId, tenantId },
      include: {
        article: true,
        depot: true,
      },
    });

    if (!lot) {
      throw new NotFoundException(`Lot with ID ${lotId} not found`);
    }

    return lot;
  }

  async createLot(data: {
    articleId: string;
    depotId: string;
    tenantId: string;
    quantite: number;
    dlc?: Date;
    numeroLot?: string;
    actor: { userId: string; email: string; role: string };
  }) {
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.lotStock.create({
        data: {
          articleId: data.articleId,
          depotId: data.depotId,
          tenantId: data.tenantId,
          quantite: data.quantite,
          quantiteInitiale: data.quantite,
          dlc: data.dlc,
          numeroLot: data.numeroLot,
        },
        include: {
          article: true,
          depot: true,
        },
      });

      // Mettre à jour le stock global
      await tx.stock.upsert({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.depotId,
          },
        },
        update: { quantite: { increment: data.quantite } },
        create: {
          articleId: data.articleId,
          depotId: data.depotId,
          quantite: data.quantite,
        },
      });

      // Audit
      await this.auditService.logEvent({
        tenantId: data.tenantId,
        actorUserId: data.actor.userId,
        actorEmail: data.actor.email,
        actorRole: data.actor.role,
        action: 'CREATION_LOT',
        targetType: 'LOT_STOCK',
        targetId: lot.id,
        reference: lot.numeroLot || lot.id,
        description: `Création lot: ${data.quantite} unités, DLC: ${data.dlc ? new Date(data.dlc).toLocaleDateString('fr-FR') : 'N/A'}`,
        metadata: { ...data },
      });

      return lot;
    });
  }

  async updateLot(tenantId: string, lotId: string, data: {
    quantite?: number;
    dlc?: Date;
    numeroLot?: string;
  }) {
    const lot = await this.prisma.lotStock.findFirst({
      where: { id: lotId, tenantId },
    });

    if (!lot) {
      throw new NotFoundException(`Lot with ID ${lotId} not found`);
    }

    const ancienneQuantite = lot.quantite;
    const nouvelleQuantite = data.quantite !== undefined ? data.quantite : ancienneQuantite;
    const difference = nouvelleQuantite - ancienneQuantite;

    return this.prisma.$transaction(async (tx) => {
      const updatedLot = await tx.lotStock.update({
        where: { id: lotId },
        data: {
          ...(data.quantite !== undefined && { quantite: data.quantite }),
          ...(data.dlc && { dlc: data.dlc }),
          ...(data.numeroLot && { numeroLot: data.numeroLot }),
        },
        include: {
          article: true,
          depot: true,
        },
      });

      // Ajuster le stock global si la quantité a changé
      if (difference !== 0) {
        await tx.stock.update({
          where: {
            articleId_depotId: {
              articleId: lot.articleId,
              depotId: lot.depotId,
            },
          },
          data: { quantite: { increment: difference } },
        });
      }

      return updatedLot;
    });
  }

  async deleteLot(tenantId: string, lotId: string) {
    const lot = await this.prisma.lotStock.findFirst({
      where: { id: lotId, tenantId },
    });

    if (!lot) {
      throw new NotFoundException(`Lot with ID ${lotId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Déduire du stock global
      await tx.stock.update({
        where: {
          articleId_depotId: {
            articleId: lot.articleId,
            depotId: lot.depotId,
          },
        },
        data: { quantite: { decrement: lot.quantite } },
      });

      await tx.lotStock.delete({
        where: { id: lotId },
      });

      return { success: true, message: 'Lot supprimé' };
    });
  }

  async getDLCAlertes(tenantId: string, depotId?: string, jours: number = 30) {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + jours);

    const where: any = {
      tenantId,
      dlc: { lte: dateLimite },
    };
    if (depotId) where.depotId = depotId;

    const lots = await this.prisma.lotStock.findMany({
      where,
      include: {
        article: true,
        depot: true,
      },
      orderBy: { dlc: 'asc' },
    });

    // Catégoriser par urgence
    const perimes = lots.filter(l => l.dlc && new Date(l.dlc) < new Date());
    const urgent = lots.filter(l => l.dlc && new Date(l.dlc) >= new Date() && new Date(l.dlc) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const bientot = lots.filter(l => l.dlc && new Date(l.dlc) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    return {
      total: lots.length,
      perimes: perimes.length,
      urgent: urgent.length,
      bientot: bientot.length,
      lots: lots.map(l => ({
        ...l,
        joursRestants: l.dlc ? Math.ceil((new Date(l.dlc).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        urgence: l.dlc && new Date(l.dlc) < new Date() ? 'PERIME' :
                 l.dlc && new Date(l.dlc) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'URGENT' : 'BIENTOT',
      })),
    };
  }
}
