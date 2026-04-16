import { BadRequestException, Injectable } from '@nestjs/common';
import { StatutVente, TypeMouvement } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma.service';
import { CreateVenteDto } from './dto/create-vente.dto';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) { }

  async findAll(tenantId: string, siteId?: string) {
    return this.prisma.stock.findMany({
      where: {
        article: { tenantId },
        ...(siteId ? { siteId } : {}),
      },
      include: { article: true, site: true },
      orderBy: { article: { designation: 'asc' } },
    });
  }

  async getMouvements(
    tenantId: string,
    siteId?: string,
    articleId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (siteId) where.siteId = siteId;
    if (articleId) where.articleId = articleId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.mouvementStock.findMany({
      where,
      include: { article: true, site: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async ajusterInventaire(
    articleId: string,
    siteId: string,
    nouvelleQuantite: number,
    motif: string,
    tenantId: string,
  ) {
    if (!motif) throw new BadRequestException('Motif obligatoire pour un ajustement');

    const stock = await this.prisma.stock.findUnique({
      where: { articleId_siteId: { articleId, siteId } },
      include: { article: true },
    });

    if (!stock) throw new BadRequestException('Stock introuvable');

    const difference = nouvelleQuantite - stock.quantite;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stock.update({
        where: { id: stock.id },
        data: { quantite: nouvelleQuantite },
        include: { article: true },
      });

      await tx.mouvementStock.create({
        data: {
          type: 'AJUSTEMENT_INVENTAIRE',
          quantite: Math.abs(difference),
          motif: `Inventaire - ${motif} (${difference >= 0 ? '+' : ''}${difference})`,
          articleId,
          siteId,
          tenantId,
        },
      });

      return updated;
    });
  }

  async getAlertes(tenantId: string, siteId?: string) {
    const stocks = await this.prisma.stock.findMany({
      where: {
        article: { tenantId },
        ...(siteId ? { siteId } : {}),
      },
      include: { article: true, site: true },
    });

    return stocks.filter((s) => s.quantite <= s.article.seuilCritique);
  }

  async getStats(tenantId: string, siteId?: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { article: { tenantId }, ...(siteId ? { siteId } : {}) },
      include: { article: true },
    });

    const totalArticles = stocks.length;
    const enRupture = stocks.filter((s) => s.quantite <= 0).length;
    const critiques = stocks.filter((s) => s.quantite > 0 && s.quantite <= s.article.seuilCritique).length;
    const valeurStock = stocks.reduce((acc, s) => acc + s.quantite * s.article.prixAchat, 0);

    return { totalArticles, enRupture, critiques, valeurStock };
  }
}

@Injectable()
export class VentesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async createVente(createVenteDto: CreateVenteDto, actor: { userId: string; email: string; role: string }) {
    const { siteId, tenantId, lignes } = createVenteDto;

    const vente = await this.prisma.$transaction(async (tx) => {
      let totalVente = 0;
      const lignesData: any[] = [];

      for (const ligne of lignes) {
        const article = await tx.article.findUnique({ where: { id: ligne.articleId } });

        if (!article || article.tenantId !== tenantId) {
          throw new BadRequestException(`Article ${ligne.articleId} introuvable.`);
        }

        const stock = await tx.stock.findUnique({
          where: { articleId_siteId: { articleId: article.id, siteId } },
        });

        if (!stock) throw new BadRequestException(`Aucun stock pour ${article.designation}.`);
        if (stock.quantite < ligne.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour ${article.designation}. Disponible: ${stock.quantite}`,
          );
        }

        const prixUnitaire = article.prixVente;
        const remise = ligne.remise ?? 0;
        const sousTotal = prixUnitaire * ligne.quantite;
        if (remise > sousTotal) {
          throw new BadRequestException(`Remise invalide pour ${article.designation}.`);
        }

        const totalLigne = sousTotal - remise;
        totalVente += totalLigne;

        lignesData.push({
          articleId: article.id,
          quantite: ligne.quantite,
          prixUnitaire,
          remise,
          total: totalLigne,
        });
      }

      const modePaiement = createVenteDto.modePaiement || 'CASH';

      if (modePaiement === 'CREDIT' && createVenteDto.clientId) {
        const client = await tx.client.findUnique({ where: { id: createVenteDto.clientId } });
        if (client && client.plafondCredit > 0) {
          const nouveauSolde = client.soldeCredit + totalVente;
          if (nouveauSolde > client.plafondCredit) {
            throw new BadRequestException(
              `Plafond crédit dépassé. Solde actuel : ${client.soldeCredit} FCFA. Plafond : ${client.plafondCredit} FCFA.`,
            );
          }
        }
      }

      const montantCash = createVenteDto.montantCash ?? (modePaiement === 'CASH' ? totalVente : 0);
      const montantOM = createVenteDto.montantOM ?? (modePaiement === 'ORANGE_MONEY' ? totalVente : 0);
      const montantMoMo = createVenteDto.montantMoMo ?? (modePaiement === 'MTN_MOMO' ? totalVente : 0);
      const montantCredit = createVenteDto.montantCredit ?? (modePaiement === 'CREDIT' ? totalVente : 0);

      const annee = new Date().getFullYear();
      const countVentes = await tx.vente.count({
        where: { tenantId, date: { gte: new Date(`${annee}-01-01T00:00:00.000Z`) } },
      });
      const reference = `FAC-${annee}-${String(countVentes + 1).padStart(6, '0')}`;

      return tx.vente.create({
        data: {
          reference,
          total: totalVente,
          statut: StatutVente.ATTENTE,
          modePaiement,
          montantCash,
          montantOM,
          montantMoMo,
          montantCredit,
          siteId,
          tenantId,
          createurId: actor.userId,
          ...(createVenteDto.clientId ? { clientId: createVenteDto.clientId } : {}),
          lignes: { create: lignesData },
        },
        include: {
          lignes: { include: { article: true } },
          site: true,
          client: true,
          createur: { select: { email: true, role: true } },
        },
      });
    });

    const remiseTotale = vente.lignes.reduce((acc, ligne) => acc + ligne.remise, 0);
    if (remiseTotale > 0) {
      await this.auditService.logEvent({
        tenantId,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'REMISE_ACCORDEE',
        targetType: 'VENTE',
        targetId: vente.id,
        reference: vente.reference,
        description: `Remise accordée sur la vente ${vente.reference}`,
        metadata: { remiseTotale, totalVente: vente.total },
      });
    }

    return vente;
  }

  async validerSortieVente(
    id: string,
    tenantId: string,
    actor: { userId: string; email: string; role: string },
  ) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: true } },
        client: true,
      },
    });

    if (!vente) throw new BadRequestException('Vente introuvable');
    if (vente.statut === StatutVente.ANNULE) throw new BadRequestException('Vente annulée');
    if (vente.statut === StatutVente.PAYE) throw new BadRequestException('Sortie déjà validée');

    const validated = await this.prisma.$transaction(async (tx) => {
      for (const ligne of vente.lignes) {
        const stock = await tx.stock.findUnique({
          where: { articleId_siteId: { articleId: ligne.articleId, siteId: vente.siteId } },
        });

        if (!stock || stock.quantite < ligne.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour ${ligne.article.designation}. Disponible: ${stock?.quantite || 0}`,
          );
        }
      }

      if (vente.modePaiement === 'CREDIT' && vente.clientId && vente.montantCredit > 0) {
        const client = await tx.client.findUnique({ where: { id: vente.clientId } });
        if (client && client.plafondCredit > 0) {
          const nouveauSolde = client.soldeCredit + vente.montantCredit;
          if (nouveauSolde > client.plafondCredit) {
            throw new BadRequestException(
              `Plafond crédit dépassé. Solde actuel : ${client.soldeCredit} FCFA. Plafond : ${client.plafondCredit} FCFA.`,
            );
          }
        }
      }

      for (const ligne of vente.lignes) {
        const stock = await tx.stock.findUnique({
          where: { articleId_siteId: { articleId: ligne.articleId, siteId: vente.siteId } },
        });

        await tx.stock.update({
          where: { id: stock!.id },
          data: { quantite: stock!.quantite - ligne.quantite },
        });

        await tx.mouvementStock.create({
          data: {
            type: TypeMouvement.SORTIE_VENTE,
            quantite: ligne.quantite,
            motif: `Vente validée ${vente.reference}`,
            articleId: ligne.articleId,
            siteId: vente.siteId,
            tenantId,
          },
        });
      }

      if (vente.modePaiement === 'CREDIT' && vente.clientId && vente.montantCredit > 0) {
        await tx.detteClient.create({
          data: {
            montant: vente.montantCredit,
            tenantId,
            clientId: vente.clientId,
            reference: vente.reference,
          },
        });

        await tx.client.update({
          where: { id: vente.clientId },
          data: { soldeCredit: { increment: vente.montantCredit } },
        });
      }

      return tx.vente.update({
        where: { id: vente.id },
        data: { statut: StatutVente.PAYE },
        include: {
          lignes: { include: { article: true } },
          site: true,
          client: true,
          createur: { select: { email: true, role: true } },
        },
      });
    });

    await this.auditService.logEvent({
      tenantId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'VALIDATION_STOCK_MAGASINIER',
      targetType: 'VENTE',
      targetId: validated.id,
      reference: validated.reference,
      description: `Sortie stock validée pour la vente ${validated.reference}`,
      metadata: { statut: validated.statut },
    });

    return validated;
  }

  async getStats(tenantId: string, siteId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const infosJour = await this.prisma.vente.aggregate({
      where: { tenantId, siteId, date: { gte: today }, statut: StatutVente.PAYE },
      _sum: { total: true },
      _count: { id: true },
    });

    const topVentes = await this.prisma.ligneVente.groupBy({
      by: ['articleId'],
      _sum: { quantite: true },
      orderBy: { _sum: { quantite: 'desc' } },
      take: 1,
      where: { vente: { tenantId, siteId, statut: StatutVente.PAYE } },
    });

    let articleStar: any = null;
    if (topVentes.length > 0) {
      const article = await this.prisma.article.findUnique({
        where: { id: topVentes[0].articleId },
      });
      articleStar = {
        designation: article?.designation || 'Inconnu',
        quantite: topVentes[0]._sum.quantite,
      };
    }

    return {
      caJour: infosJour._sum.total || 0,
      nbVentesJour: infosJour._count.id || 0,
      articleStar,
    };
  }

  async findAll(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    siteId?: string,
    statut?: string,
  ) {
    const where: any = { tenantId };
    if (siteId) where.siteId = siteId;
    if (statut) where.statut = statut;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    return this.prisma.vente.findMany({
      where,
      include: {
        lignes: { include: { article: true } },
        site: true,
        client: true,
        createur: { select: { email: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: {
        lignes: { include: { article: true } },
        site: true,
        client: true,
        createur: { select: { email: true, role: true } },
      },
    });
    if (!vente) throw new BadRequestException('Vente introuvable');
    return vente;
  }

  async annulerVente(
    id: string,
    motif: string,
    tenantId: string,
    actor: { userId: string; email: string; role: string },
  ) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, tenantId },
      include: { lignes: true },
    });

    if (!vente) throw new BadRequestException('Vente introuvable');
    if (vente.statut === StatutVente.ANNULE) throw new BadRequestException('Vente déjà annulée');
    if (!motif) throw new BadRequestException('Motif d\'annulation obligatoire');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (vente.statut === StatutVente.PAYE) {
        for (const ligne of vente.lignes) {
          await tx.stock.updateMany({
            where: { articleId: ligne.articleId, siteId: vente.siteId },
            data: { quantite: { increment: ligne.quantite } },
          });

          await tx.mouvementStock.create({
            data: {
              type: TypeMouvement.RETOUR_CLIENT,
              quantite: ligne.quantite,
              motif: `Annulation vente ${vente.reference} - ${motif}`,
              articleId: ligne.articleId,
              siteId: vente.siteId,
              tenantId,
            },
          });
        }
      }

      if (vente.modePaiement === 'CREDIT' && vente.clientId && vente.montantCredit > 0) {
        await tx.detteClient.deleteMany({
          where: {
            tenantId,
            clientId: vente.clientId,
            reference: vente.reference,
          },
        });

        await tx.client.update({
          where: { id: vente.clientId },
          data: { soldeCredit: { decrement: vente.montantCredit } },
        });
      }

      return tx.vente.update({
        where: { id },
        data: {
          statut: StatutVente.ANNULE,
          motifAnnulation: motif,
        },
      });
    });

    await this.auditService.logEvent({
      tenantId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'VENTE_ANNULEE',
      targetType: 'VENTE',
      targetId: vente.id,
      reference: vente.reference,
      description: `Annulation de la vente ${vente.reference}`,
      metadata: { motif, ancienStatut: vente.statut },
    });

    return updated;
  }

  async findEnAttenteValidation(tenantId: string, siteId?: string) {
    return this.prisma.vente.findMany({
      where: {
        tenantId,
        statut: StatutVente.ATTENTE,
        ...(siteId ? { siteId } : {}),
      },
      include: {
        lignes: { include: { article: true } },
        site: true,
        client: true,
        createur: { select: { email: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}
