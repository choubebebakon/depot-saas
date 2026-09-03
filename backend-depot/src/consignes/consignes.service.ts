import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MouvementConsigne } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CreateTypeConsigneDto,
  UpdateTypeConsigneDto,
  MouvementConsigneDto,
  RenduSansAchatDto,
  VenteAvecConsignesDto,
} from './dto/consigne.dto';

@Injectable()
export class ConsignesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertDepotScope(tenantId: string, depotId: string) {
    const depot = await this.prisma.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true },
    });
    if (!depot) {
      throw new NotFoundException('Dépôt introuvable ou non autorisé');
    }
  }

  private async assertClientScope(
    tenantId: string,
    depotId: string,
    clientId: string,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId, depotId },
      select: { id: true, nom: true, telephone: true, depotId: true },
    });
    if (!client) {
      throw new NotFoundException('Client introuvable dans le dépôt actif');
    }
    return client;
  }

  private async assertVenteScope(
    tenantId: string,
    depotId: string,
    venteId: string,
    clientId?: string,
  ) {
    const vente = await this.prisma.vente.findFirst({
      where: {
        id: venteId,
        tenantId,
        depotId,
        ...(clientId ? { clientId } : {}),
      },
      select: { id: true, clientId: true, depotId: true, tenantId: true },
    });
    if (!vente) {
      throw new NotFoundException('Vente introuvable dans le dépôt actif');
    }
    return vente;
  }

  private async lockConsigneScope(
    tx: any,
    tenantId: string,
    depotId: string,
    typeConsigneId: string,
    clientId?: string,
  ) {
    const key = [
      'consigne',
      tenantId,
      depotId,
      typeConsigneId,
      clientId || 'DEPOT',
    ].join(':');
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))
    `;
  }

  private validateConsigneLines(lines: VenteAvecConsignesDto['lignesConsignes']) {
    const seen = new Set<string>();
    for (const line of lines) {
      if (seen.has(line.typeConsigneId)) {
        throw new BadRequestException(
          'Un même type de consigne ne peut apparaître qu’une seule fois par opération',
        );
      }
      seen.add(line.typeConsigneId);
      if (line.quantiteSortie === 0 && line.quantiteRendue === 0) {
        throw new BadRequestException(
          'Chaque ligne de consigne doit contenir une quantité non nulle',
        );
      }
    }
  }

  // ── Configuration des types de consignes ─────────────────

  async createTypeConsigne(tenantId: string, dto: CreateTypeConsigneDto) {
    const existant = await this.prisma.typeConsigneConfig.findUnique({
      where: { tenantId_type: { tenantId, type: dto.type as any } },
    });
    if (existant) {
      throw new BadRequestException(
        `Le type ${dto.type} existe déjà pour ce tenant.`,
      );
    }

    return this.prisma.typeConsigneConfig.create({
      data: {
        type: dto.type as any,
        valeurXAF: dto.valeurXAF,
        description: dto.description,
        tenantId,
      },
    });
  }

  async findTypesConsigne(tenantId: string) {
    return this.prisma.typeConsigneConfig.findMany({
      where: { tenantId },
      orderBy: { type: 'asc' },
    });
  }

  async updateTypeConsigne(
    id: string,
    tenantId: string,
    dto: UpdateTypeConsigneDto,
  ) {
    const type = await this.prisma.typeConsigneConfig.findFirst({
      where: { id, tenantId },
    });
    if (!type) throw new NotFoundException('Type de consigne introuvable');

    return this.prisma.typeConsigneConfig.update({
      where: { id },
      data: { valeurXAF: dto.valeurXAF, description: dto.description },
    });
  }

  // ── Inventaire des vides au dépôt ────────────────────────

  async getInventaireVides(tenantId: string, depotId: string) {
    await this.assertDepotScope(tenantId, depotId);

    const types = await this.prisma.typeConsigneConfig.findMany({
      where: { tenantId },
      orderBy: { type: 'asc' },
    });

    return Promise.all(
      types.map(async (type) => {
        const mouvements = await this.prisma.mouvementConsigne.findMany({
          where: { typeConsigneId: type.id, tenantId, depotId },
          select: { estSortie: true, quantite: true },
        });

        const totalSorties = mouvements
          .filter((m) => m.estSortie)
          .reduce((acc, m) => acc + m.quantite, 0);
        const totalEntrees = mouvements
          .filter((m) => !m.estSortie)
          .reduce((acc, m) => acc + m.quantite, 0);
        const stockVides = Math.max(0, totalEntrees - totalSorties);

        return {
          typeConsigne: type,
          stockVides,
          totalSorties,
          totalEntrees,
          valeurTotale: stockVides * type.valeurXAF,
        };
      }),
    );
  }

  // ── Portefeuille consignes par client ─────────────────────

  async getPortefeuilleClient(
    clientId: string,
    tenantId: string,
    depotId: string,
  ) {
    await this.assertDepotScope(tenantId, depotId);
    await this.assertClientScope(tenantId, depotId, clientId);

    const portefeuille = await this.prisma.portefeuilleConsigne.findMany({
      where: { clientId, depotId },
      include: { typeConsigne: true, client: true },
      orderBy: { typeConsigne: { type: 'asc' } },
    });

    const valeurTotale = portefeuille.reduce(
      (acc, p) => acc + p.quantite * p.typeConsigne.valeurXAF,
      0,
    );

    return { portefeuille, valeurTotale };
  }

  async getAllPortefeuilles(tenantId: string, depotId: string) {
    await this.assertDepotScope(tenantId, depotId);

    const clients = await this.prisma.client.findMany({
      where: { tenantId, depotId },
      include: {
        portefeuilleConsignes: {
          where: { depotId, quantite: { gt: 0 } },
          include: { typeConsigne: true },
          orderBy: { typeConsigne: { type: 'asc' } },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return clients
      .filter((c) => c.portefeuilleConsignes.length > 0)
      .map((c) => ({
        client: { id: c.id, nom: c.nom, telephone: c.telephone },
        consignes: c.portefeuilleConsignes,
        valeurTotale: c.portefeuilleConsignes.reduce(
          (acc, p) => acc + p.quantite * p.typeConsigne.valeurXAF,
          0,
        ),
      }));
  }

  // ── Mouvement de consigne ─────────────────────────────────

  async enregistrerMouvement(
    tenantId: string,
    depotId: string,
    dto: MouvementConsigneDto,
  ) {
    await this.assertDepotScope(tenantId, depotId);

    const typeConsigne = await this.prisma.typeConsigneConfig.findFirst({
      where: { id: dto.typeConsigneId, tenantId },
    });
    if (!typeConsigne) {
      throw new NotFoundException('Type de consigne introuvable');
    }

    if (dto.clientId) await this.assertClientScope(tenantId, depotId, dto.clientId);
    const vente = dto.venteId
      ? await this.assertVenteScope(tenantId, depotId, dto.venteId, dto.clientId)
      : null;

    const effectiveClientId = dto.clientId ?? vente?.clientId ?? undefined;
    if (dto.venteId && dto.estSortie && !effectiveClientId) {
      // Une vente sans client peut avoir des consignes dépôt, sans portefeuille client.
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockConsigneScope(
        tx,
        tenantId,
        depotId,
        dto.typeConsigneId,
        effectiveClientId,
      );

      const mouvement = await tx.mouvementConsigne.create({
        data: {
          quantite: dto.quantite,
          estSortie: dto.estSortie,
          motif: dto.motif,
          typeConsigneId: dto.typeConsigneId,
          venteId: dto.venteId || null,
          tenantId,
          depotId,
        },
        include: { typeConsigne: true },
      });

      if (effectiveClientId) {
        const portefeuille = await tx.portefeuilleConsigne.findFirst({
          where: {
            clientId: effectiveClientId,
            typeConsigneId: dto.typeConsigneId,
            depotId,
          },
        });

        if (portefeuille) {
          const newQte = dto.estSortie
            ? portefeuille.quantite + dto.quantite
            : portefeuille.quantite - dto.quantite;

          if (newQte < 0) {
            throw new BadRequestException(
              'Quantité rendue supérieure au portefeuille client',
            );
          }

          await tx.portefeuilleConsigne.update({
            where: { id: portefeuille.id },
            data: { quantite: newQte },
          });
        } else if (dto.estSortie) {
          await tx.portefeuilleConsigne.create({
            data: {
              clientId: effectiveClientId,
              typeConsigneId: dto.typeConsigneId,
              quantite: dto.quantite,
              depotId,
            },
          });
        } else {
          throw new BadRequestException(
            'Aucun portefeuille client disponible pour ce retour',
          );
        }
      }

      return mouvement;
    });
  }

  // ── Traiter une vente avec consignes ──────────────────────

  async traiterVenteConsignes(
    tenantId: string,
    depotId: string,
    dto: VenteAvecConsignesDto,
  ) {
    await this.assertDepotScope(tenantId, depotId);
    const vente = await this.assertVenteScope(
      tenantId,
      depotId,
      dto.venteId,
      dto.clientId,
    );

    if (!dto.lignesConsignes.length) {
      return { mouvements: [], caution: 0 };
    }
    this.validateConsigneLines(dto.lignesConsignes);

    const effectiveClientId = vente.clientId ?? undefined;
    if (dto.clientId && dto.clientId !== effectiveClientId) {
      throw new BadRequestException(
        'Le client fourni ne correspond pas au client de la vente',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let caution = 0;
      const mouvements: MouvementConsigne[] = [];

      for (const ligne of dto.lignesConsignes) {
        await this.lockConsigneScope(
          tx,
          tenantId,
          depotId,
          ligne.typeConsigneId,
          effectiveClientId,
        );

        const typeConsigne = await tx.typeConsigneConfig.findFirst({
          where: { id: ligne.typeConsigneId, tenantId },
        });
        if (!typeConsigne) {
          throw new BadRequestException('Type de consigne introuvable');
        }

        const netSortie = ligne.quantiteSortie - ligne.quantiteRendue;

        if (ligne.quantiteSortie > 0) {
          const mvtSortie = await tx.mouvementConsigne.create({
            data: {
              quantite: ligne.quantiteSortie,
              estSortie: true,
              motif: 'Vente — emballages sortis',
              typeConsigneId: ligne.typeConsigneId,
              venteId: dto.venteId,
              tenantId,
              depotId,
            },
          });
          mouvements.push(mvtSortie);
        }

        if (ligne.quantiteRendue > 0) {
          const mvtEntree = await tx.mouvementConsigne.create({
            data: {
              quantite: ligne.quantiteRendue,
              estSortie: false,
              motif: 'Vente — vides rendus',
              typeConsigneId: ligne.typeConsigneId,
              venteId: dto.venteId,
              tenantId,
              depotId,
            },
          });
          mouvements.push(mvtEntree);
        }

        if (netSortie > 0) {
          caution += netSortie * typeConsigne.valeurXAF;
        }

        if (effectiveClientId && netSortie !== 0) {
          const portefeuille = await tx.portefeuilleConsigne.findFirst({
            where: {
              clientId: effectiveClientId,
              typeConsigneId: ligne.typeConsigneId,
              depotId,
            },
          });

          const newQte = (portefeuille?.quantite ?? 0) + netSortie;
          if (newQte < 0) {
            throw new BadRequestException(
              'Retour de consignes supérieur au portefeuille client',
            );
          }

          if (portefeuille) {
            await tx.portefeuilleConsigne.update({
              where: { id: portefeuille.id },
              data: { quantite: newQte },
            });
          } else if (netSortie > 0) {
            await tx.portefeuilleConsigne.create({
              data: {
                clientId: effectiveClientId,
                typeConsigneId: ligne.typeConsigneId,
                quantite: netSortie,
                depotId,
              },
            });
          }
        }
      }

      return { mouvements, caution };
    });
  }

  // ── Rendu sans achat ──────────────────────────────────────

  async renduSansAchat(
    tenantId: string,
    depotId: string,
    dto: RenduSansAchatDto,
  ) {
    await this.assertDepotScope(tenantId, depotId);
    await this.assertClientScope(tenantId, depotId, dto.clientId);

    const typeConsigne = await this.prisma.typeConsigneConfig.findFirst({
      where: { id: dto.typeConsigneId, tenantId },
    });
    if (!typeConsigne) {
      throw new NotFoundException('Type de consigne introuvable');
    }

    const montantRembourse = dto.estRemboursementCash
      ? dto.quantite * typeConsigne.valeurXAF
      : 0;

    return this.prisma.$transaction(async (tx) => {
      await this.lockConsigneScope(
        tx,
        tenantId,
        depotId,
        dto.typeConsigneId,
        dto.clientId,
      );

      const portefeuille = await tx.portefeuilleConsigne.findFirst({
        where: {
          clientId: dto.clientId,
          typeConsigneId: dto.typeConsigneId,
          depotId,
        },
      });

      if (!portefeuille || portefeuille.quantite < dto.quantite) {
        throw new BadRequestException(
          'Quantité retournée supérieure au portefeuille client',
        );
      }

      const mouvement = await tx.mouvementConsigne.create({
        data: {
          quantite: dto.quantite,
          estSortie: false,
          estRemboursementCash: dto.estRemboursementCash,
          montantRembourse,
          motif: dto.estRemboursementCash
            ? 'Rendu sans achat — remboursement cash'
            : 'Rendu sans achat — avoir emballage',
          typeConsigneId: dto.typeConsigneId,
          tenantId,
          depotId,
        },
        include: { typeConsigne: true },
      });

      await tx.portefeuilleConsigne.update({
        where: { id: portefeuille.id },
        data: { quantite: { decrement: dto.quantite } },
      });

      return {
        mouvement,
        montantRembourse,
        mode: dto.estRemboursementCash ? 'CASH' : 'AVOIR',
        message: dto.estRemboursementCash
          ? `Remboursement de ${montantRembourse.toLocaleString('fr-FR')} FCFA à effectuer`
          : `Avoir de ${(dto.quantite * typeConsigne.valeurXAF).toLocaleString('fr-FR')} FCFA créé`,
      };
    });
  }

  // ── Historique mouvements ─────────────────────────────────

  async getHistorique(tenantId: string, depotId: string, limit = 100) {
    await this.assertDepotScope(tenantId, depotId);
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

    return this.prisma.mouvementConsigne.findMany({
      where: { tenantId, depotId },
      include: { typeConsigne: true, vente: true },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }

  // ── Stats globales consignes ──────────────────────────────

  async getStats(tenantId: string, depotId: string) {
    const [inventaire, portefeuilles] = await Promise.all([
      this.getInventaireVides(tenantId, depotId),
      this.getAllPortefeuilles(tenantId, depotId),
    ]);

    const totalVidesDepot = inventaire.reduce(
      (acc, i) => acc + i.stockVides,
      0,
    );
    const valeurVidesDepot = inventaire.reduce(
      (acc, i) => acc + i.valeurTotale,
      0,
    );
    const totalDuClients = portefeuilles.reduce(
      (acc, p) => acc + p.valeurTotale,
      0,
    );
    const nbClientsAvecConsignes = portefeuilles.length;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const remboursements = await this.prisma.mouvementConsigne.aggregate({
      where: {
        tenantId,
        depotId,
        estRemboursementCash: true,
        createdAt: { gte: debutMois },
      },
      _sum: { montantRembourse: true },
      _count: { id: true },
    });

    return {
      totalVidesDepot,
      valeurVidesDepot,
      totalDuClients,
      nbClientsAvecConsignes,
      remboursementsMois: remboursements._sum.montantRembourse || 0,
      nbRemboursements: remboursements._count.id || 0,
    };
  }
}
