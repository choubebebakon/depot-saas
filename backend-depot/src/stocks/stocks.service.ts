import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TypeMouvement } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SignalerAvarieDto } from './dto/signaler-avarie.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';
import { DepotScopeService } from '../common/depot-scope.service';

@Injectable()
export class StocksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private depotScope: DepotScopeService,
  ) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException(
        'depotId est obligatoire pour isoler les donnees par depot.',
      );
    }

    return depotId;
  }

  private assertScopedTenant(tenantId: string): string {
    const scope = this.depotScope.requireTenantId();
    if (scope !== tenantId) {
      throw new ForbiddenException('Accès refusé au tenant demandé.');
    }
    return scope;
  }

  private async assertScopedDepot(tenantId: string, depotId: string): Promise<string> {
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();
    if (scopeDepotId !== depotId) {
      throw new ForbiddenException('Accès refusé à ce dépôt.');
    }

    const depot = await this.prisma.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true },
    });
    if (!depot) throw new ForbiddenException('Accès refusé à ce dépôt.');
    return depot.id;
  }

  private async assertTenantArticle(
    tx: any,
    tenantId: string,
    articleId: string,
  ): Promise<void> {
    const article = await tx.article.findFirst({
      where: { id: articleId, tenantId },
      select: { id: true },
    });
    if (!article) throw new NotFoundException('Article introuvable dans ce tenant.');
  }

  private validateNonNegativeQuantity(value: number, field: string): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(`${field} doit être un entier supérieur ou égal à 0.`);
    }
  }

  private validatePositiveQuantity(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} doit être un entier strictement positif.`);
    }
  }

  // 1. Liste des stocks
  async obtenirTousLesStocks(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    await this.assertScopedDepot(tenantId, selectedDepotId);

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
    await this.assertScopedDepot(tenantId, selectedDepotId);

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
    await this.assertScopedDepot(tenantId, selectedDepotId);

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
    this.validateNonNegativeQuantity(data.nouvelleQuantite, 'nouvelleQuantite');
    if (data.seuilCritique !== undefined) {
      this.validateNonNegativeQuantity(data.seuilCritique, 'seuilCritique');
    }
    await this.assertScopedDepot(data.tenantId, data.depotId);

    let auditAfterCommit: any = null;
    const result = await this.prisma.$transaction(async (tx) => {
      await this.assertTenantArticle(tx, data.tenantId, data.articleId);

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

        auditAfterCommit = await this.auditService.logEventInTransaction(tx, {
          tenantId: data.tenantId,
          depotId: data.depotId,
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

    if (auditAfterCommit) {
      this.auditService.emitAuditUpdate(data.tenantId, auditAfterCommit);
    }

    return result;
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
    this.validatePositiveQuantity(data.quantite, 'quantite');
    this.assertScopedTenant(data.tenantId);

    if (data.sourceDepotId === data.destDepotId) {
      throw new BadRequestException('Le dépôt source et le dépôt destination doivent être différents.');
    }

    const scope = this.depotScope.getScope();
    if (scope.role !== 'PATRON') {
      await this.assertScopedDepot(data.tenantId, data.sourceDepotId);
      if (data.destDepotId !== data.sourceDepotId) {
        throw new ForbiddenException('Seul le patron peut transférer entre dépôts.');
      }
    }

    const depots = await this.prisma.depot.findMany({
      where: {
        tenantId: data.tenantId,
        id: { in: [data.sourceDepotId, data.destDepotId] },
        isArchived: false,
      },
      select: { id: true },
    });
    if (depots.length !== 2) {
      throw new ForbiddenException('Les dépôts source et destination doivent appartenir au tenant et être actifs.');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.assertTenantArticle(tx, data.tenantId, data.articleId);

      const source = await tx.stock.updateMany({
        where: {
          articleId: data.articleId,
          depotId: data.sourceDepotId,
          quantite: { gte: data.quantite },
        },
        data: { quantite: { decrement: data.quantite } },
      });
      if (source.count !== 1) {
        throw new BadRequestException('Stock source insuffisant ou introuvable.');
      }

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
    await this.assertScopedDepot(tenantId, selectedDepotId);

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
    this.validatePositiveQuantity(data.quantite, 'quantite');
    await this.assertScopedDepot(data.tenantId, data.depotId);

    let auditAfterCommit: any = null;
    const result = await this.prisma.$transaction(async (tx) => {
      await this.assertTenantArticle(tx, data.tenantId, data.articleId);

      const stockUpdate = await tx.stock.updateMany({
        where: {
          articleId: data.articleId,
          depotId: data.depotId,
          quantite: { gte: data.quantite },
        },
        data: { quantite: { decrement: data.quantite } },
      });
      if (stockUpdate.count !== 1) {
        throw new BadRequestException('Stock insuffisant ou introuvable pour déclarer cette avarie.');
      }

      const stock = await tx.stock.findUniqueOrThrow({
        where: {
          articleId_depotId: {
            articleId: data.articleId,
            depotId: data.depotId,
          },
        },
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

      auditAfterCommit = await this.auditService.logEventInTransaction(tx, {
        tenantId: data.tenantId,
        depotId: data.depotId,
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

    if (auditAfterCommit) {
      this.auditService.emitAuditUpdate(data.tenantId, auditAfterCommit);
    }

    return result;
  }

  // 8. GET /:id — Détail d'un article (Phase 4)
  async findOne(tenantId: string, id: string) {
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();
    const stock = await this.prisma.stock.findFirst({
      where: { id, depotId: scopeDepotId, depot: { tenantId, isArchived: false } },
      include: { article: true, depot: true, tricycle: true },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    return stock;
  }

  // 9. PUT /:id — Mise à jour d'un article (Phase 4)
  async update(tenantId: string, id: string, dto: UpdateStockDto) {
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();
    const stock = await this.prisma.stock.findFirst({
      where: { id, depotId: scopeDepotId, depot: { tenantId, isArchived: false } },
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
    this.assertScopedTenant(tenantId);
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
    await this.assertScopedDepot(tenantId, selectedDepotId);
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
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();
    if (depotId && depotId !== scopeDepotId) {
      throw new ForbiddenException('Accès refusé à ce dépôt.');
    }
    const selectedDepotId = depotId || scopeDepotId;

    return this.prisma.lotStock.findMany({
      where: { tenantId, depotId: selectedDepotId, ...(articleId ? { articleId } : {}) },
      include: {
        article: true,
        depot: true,
      },
      orderBy: { dlc: 'asc' },
    });
  }

  async getLotById(tenantId: string, lotId: string) {
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();
    const lot = await this.prisma.lotStock.findFirst({
      where: { id: lotId, tenantId, depotId: scopeDepotId },
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
    this.validatePositiveQuantity(data.quantite, 'quantite');
    await this.assertScopedDepot(data.tenantId, data.depotId);

    let auditAfterCommit: any = null;
    const result = await this.prisma.$transaction(async (tx) => {
      await this.assertTenantArticle(tx, data.tenantId, data.articleId);

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

      auditAfterCommit = await this.auditService.logEventInTransaction(tx, {
        tenantId: data.tenantId,
        depotId: data.depotId,
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

    if (auditAfterCommit) {
      this.auditService.emitAuditUpdate(data.tenantId, auditAfterCommit);
    }

    return result;
  }

  async updateLot(tenantId: string, lotId: string, data: {
    quantite?: number;
    dlc?: Date;
    numeroLot?: string;
  }) {
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();
    if (data.quantite !== undefined) this.validateNonNegativeQuantity(data.quantite, 'quantite');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const lot = await tx.lotStock.findFirst({
          where: { id: lotId, tenantId, depotId: scopeDepotId },
        });

        if (!lot) {
          throw new NotFoundException(`Lot with ID ${lotId} not found`);
        }

        const nouvelleQuantite = data.quantite !== undefined ? data.quantite : lot.quantite;
        const difference = nouvelleQuantite - lot.quantite;

        if (difference < 0) {
          const stockUpdate = await tx.stock.updateMany({
            where: {
              articleId: lot.articleId,
              depotId: lot.depotId,
              quantite: { gte: Math.abs(difference) },
            },
            data: { quantite: { decrement: Math.abs(difference) } },
          });

          if (stockUpdate.count !== 1) {
            throw new BadRequestException(
              'Stock global insuffisant pour réduire ce lot à cette quantité.',
            );
          }
        } else if (difference > 0) {
          const stockUpdate = await tx.stock.updateMany({
            where: {
              articleId: lot.articleId,
              depotId: lot.depotId,
            },
            data: { quantite: { increment: difference } },
          });

          if (stockUpdate.count !== 1) {
            throw new BadRequestException('Stock global introuvable pour augmenter ce lot.');
          }
        }

        return tx.lotStock.update({
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
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Le lot a été modifié simultanément. Réessayez.');
      }
      throw error;
    }
  }

  async deleteLot(tenantId: string, lotId: string) {
    this.assertScopedTenant(tenantId);
    const scopeDepotId = this.depotScope.requireDepotId();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const lot = await tx.lotStock.findFirst({
          where: { id: lotId, tenantId, depotId: scopeDepotId },
        });

        if (!lot) {
          throw new NotFoundException(`Lot with ID ${lotId} not found`);
        }

        const stockUpdate = await tx.stock.updateMany({
          where: {
            articleId: lot.articleId,
            depotId: lot.depotId,
            quantite: { gte: lot.quantite },
          },
          data: { quantite: { decrement: lot.quantite } },
        });
        if (stockUpdate.count !== 1) {
          throw new BadRequestException('Stock global insuffisant pour supprimer ce lot.');
        }

        await tx.lotStock.delete({
          where: { id: lotId },
        });

        return { success: true, message: 'Lot supprimé' };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Le lot a été modifié simultanément. Réessayez.');
      }
      throw error;
    }
  }

  async getDLCAlertes(tenantId: string, depotId?: string, jours: number = 30) {
    this.assertScopedTenant(tenantId);
    if (!Number.isInteger(jours) || jours < 0 || jours > 3650) {
      throw new BadRequestException('jours doit être un entier compris entre 0 et 3650.');
    }
    const scopeDepotId = this.depotScope.requireDepotId();
    if (depotId && depotId !== scopeDepotId) {
      throw new ForbiddenException('Accès refusé à ce dépôt.');
    }
    const selectedDepotId = depotId || scopeDepotId;

    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + jours);

    const where: any = {
      tenantId,
      depotId: selectedDepotId,
      dlc: { lte: dateLimite },
    };

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
