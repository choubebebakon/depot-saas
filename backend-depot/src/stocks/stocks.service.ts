import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TypeMouvement } from '@prisma/client';
import { SignalerAvarieDto } from './dto/signaler-avarie.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StocksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) { }

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException('depotId est obligatoire pour isoler les donnees par depot.');
    }

    return depotId;
  }

  // 1. Liste des stocks
  async obtenirTousLesStocks(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    return this.prisma.stock.findMany({
      where: {
        depotId: selectedDepotId,
        depot: { tenantId }
      },
      include: {
        article: true,
        depot: true
      },
      orderBy: { article: { designation: 'asc' } }
    });
  }

  // 2. Statistiques (Valeur stock, Ruptures, Critiques)
  async obtenirStats(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    const stocks = await this.prisma.stock.findMany({
      where: { depotId: selectedDepotId, depot: { tenantId } },
      include: { article: true }
    });

    const totalArticles = stocks.length;
    const enRupture = stocks.filter(s => s.quantite <= 0).length;

    const critiques = stocks.filter(s => {
      const seuil = s.seuilCritique ?? s.article.seuilCritique ?? 0;
      return s.quantite > 0 && s.quantite <= seuil;
    }).length;

    const valeurStock = stocks.reduce((acc, s) => {
      return acc + (s.quantite * (s.article.prixAchat || 0));
    }, 0);

    return { totalArticles, enRupture, critiques, valeurStock };
  }

  // 3. Alertes critiques
  async obtenirAlertes(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    const stocks = await this.prisma.stock.findMany({
      where: { depotId: selectedDepotId, depot: { tenantId } },
      include: { article: true }
    });

    return stocks.filter(s => {
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
        where: { articleId_depotId: { articleId: data.articleId, depotId: data.depotId } },
        include: { article: true }
      });

      const ancienneQt = stockActuel?.quantite || 0;
      const difference = data.nouvelleQuantite - ancienneQt;

      const stockMisAJour = await tx.stock.upsert({
        where: { articleId_depotId: { articleId: data.articleId, depotId: data.depotId } },
        update: { 
          quantite: data.nouvelleQuantite,
          ...(data.seuilCritique !== undefined ? { seuilCritique: data.seuilCritique } : {})
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
            motif: data.motif || "Ajustement manuel",
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
          metadata: { ...data, ancienneQt, difference }
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
        where: { articleId_depotId: { articleId: data.articleId, depotId: data.sourceDepotId } },
        data: { quantite: { decrement: data.quantite } },
      });

      await tx.stock.upsert({
        where: { articleId_depotId: { articleId: data.articleId, depotId: data.destDepotId } },
        update: { quantite: { increment: data.quantite } },
        create: { articleId: data.articleId, depotId: data.destDepotId, quantite: data.quantite },
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
      take: 200
    });
  }

  // 7. Signalement d'Avarie (Casse/Perte)
  async signalerAvarie(data: SignalerAvarieDto, actor: any) {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.update({
        where: { articleId_depotId: { articleId: data.articleId, depotId: data.depotId } },
        data: { quantite: { decrement: data.quantite } },
        include: { article: true }
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
        }
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
        metadata: { ...data }
      });

      return stock;
    });
  }
}
