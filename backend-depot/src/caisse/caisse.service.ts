import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { StatutVente } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';
import {
  OuvrirCaisseDto,
  FermerCaisseDto,
  CreateDepenseDto,
} from './dto/caisse.dto';

@Injectable()
export class CaisseService {
  constructor(
    private prisma: PrismaService,
    private readonly depotScope: DepotScopeService,
  ) {}

  private assertScope(tenantId: string, depotId: string): void {
    const scopedTenantId = this.depotScope.getTenantId();
    const scopedDepotId = this.depotScope.getDepotId();

    if (!scopedTenantId || scopedTenantId !== tenantId) {
      throw new ForbiddenException('Contexte tenant invalide.');
    }

    if (!scopedDepotId || scopedDepotId !== depotId) {
      throw new ForbiddenException('Contexte dépôt invalide.');
    }
  }

  // ── Sessions Caisse ──────────────────────────────────────

  async ouvrirSession(dto: OuvrirCaisseDto) {
    if (!dto.depotId || !dto.tenantId || !dto.userId) {
      throw new BadRequestException('Contexte de caisse incomplet.');
    }

    this.assertScope(dto.tenantId, dto.depotId);

    const sessionExistante = await this.prisma.sessionCaisse.findFirst({
      where: { depotId: dto.depotId, tenantId: dto.tenantId, estOuverte: true },
    });

    if (sessionExistante) {
      throw new BadRequestException(
        'Une session de caisse est déjà ouverte sur ce Depot.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.sessionCaisse.create({
        data: {
          fondInitial: dto.fondInitial,
          depotId: dto.depotId,
          userId: dto.userId,
          tenantId: dto.tenantId,
          estOuverte: true,
        },
      });

      await tx.mouvementCaisse.create({
        data: {
          type: 'FOND_INITIAL',
          montant: dto.fondInitial,
          motif: 'Ouverture de caisse',
          sessionId: session.id,
        },
      });

      return session;
    });
  }

  async fermerSession(dto: FermerCaisseDto & { depotId: string }) {
    if (!dto.tenantId || !dto.depotId) {
      throw new BadRequestException('Contexte de caisse incomplet.');
    }

    this.assertScope(dto.tenantId, dto.depotId);

    const session = await this.prisma.sessionCaisse.findFirst({
      where: {
        id: dto.sessionId,
        tenantId: dto.tenantId,
        depotId: dto.depotId,
      },
      include: { mouvements: true },
    });

    if (!session) throw new BadRequestException('Session introuvable');
    if (!session.estOuverte)
      throw new BadRequestException('Session déjà fermée');

    const totalEntrees = session.mouvements
      .filter((m) =>
        ['FOND_INITIAL', 'ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE'].includes(
          m.type,
        ),
      )
      .reduce((acc, m) => acc + m.montant, 0);

    const totalSorties = session.mouvements
      .filter((m) =>
        ['DECAISSEMENT_DEPENSE', 'DECAISSEMENT_VIDES'].includes(m.type),
      )
      .reduce((acc, m) => acc + m.montant, 0);

    const soldeTheorique = totalEntrees - totalSorties;
    const ecart = dto.fondFinal - soldeTheorique;

    return this.prisma.sessionCaisse.update({
      where: { id: dto.sessionId },
      data: {
        fondFinal: dto.fondFinal,
        ecart,
        motifEcart: ecart !== 0 ? dto.motifEcart : null,
        estOuverte: false,
        dateCloture: new Date(),
      },
    });
  }

  async getSessionActive(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);
    return this.prisma.sessionCaisse.findFirst({
      where: { tenantId, depotId, estOuverte: true },
      include: {
        mouvements: { orderBy: { createdAt: 'desc' } },
        user: { select: { email: true, role: true } },
      },
    });
  }

  async getHistorique(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);
    return this.prisma.sessionCaisse.findMany({
      where: { tenantId, depotId },
      include: {
        _count: { select: { mouvements: true } },
        user: { select: { email: true } },
      },
      orderBy: { dateOuverture: 'desc' },
      take: 30,
    });
  }

  // ── Dépenses ─────────────────────────────────────────────

  async createDepense(dto: CreateDepenseDto & { tenantId: string; depotId: string }) {
    this.assertScope(dto.tenantId, dto.depotId);

    const session = await this.prisma.sessionCaisse.findFirst({
      where: { depotId: dto.depotId, tenantId: dto.tenantId, estOuverte: true },
    });

    const depense = await this.prisma.depense.create({
      data: {
        id: (dto as any).id || undefined,
        categorie: dto.categorie,
        montant: dto.montant,
        motif: dto.motif,
        depotId: dto.depotId,
        tenantId: dto.tenantId,
        photoUrl: dto.photoUrl,
        createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : undefined,
      },
    });

    if (session) {
      await this.prisma.mouvementCaisse.create({
        data: {
          type: 'DECAISSEMENT_DEPENSE',
          montant: dto.montant,
          motif: `${dto.categorie} — ${dto.motif}`,
          reference: depense.id,
          sessionId: session.id,
          createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : undefined,
        },
      });
    }

    return depense;
  }

  async getDepenses(
    tenantId: string,
    depotId: string,
    dateDebut?: string,
    dateFin?: string,
  ) {
    this.assertScope(tenantId, depotId);

    const where: any = { tenantId, depotId };

    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        where.createdAt.lte = fin;
      }
    }

    return this.prisma.depense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Résumé caisse du jour ────────────────────────────────

  async getResume(tenantId: string, depotId: string) {
    this.assertScope(tenantId, depotId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ventesJour = await this.prisma.vente.aggregate({
      where: {
        tenantId,
        depotId,
        date: { gte: today },
        statut: StatutVente.PAYE,
      },
      _sum: {
        montantCash: true,
        montantOM: true,
        montantMoMo: true,
        montantCredit: true,
        total: true,
      },
      _count: { _all: true },
    });

    const depensesJour = await this.prisma.depense.aggregate({
      where: { tenantId, depotId, createdAt: { gte: today } },
      _sum: { montant: true },
      _count: { _all: true },
    });

    const sessionActive = await this.getSessionActive(tenantId, depotId);

    return {
      ventesTotal: ventesJour._sum?.total || 0,
      ventesCash: ventesJour._sum?.montantCash || 0,
      ventesOM: ventesJour._sum?.montantOM || 0,
      ventesMoMo: ventesJour._sum?.montantMoMo || 0,
      ventesCredit: ventesJour._sum?.montantCredit || 0,
      nbVentes: ventesJour._count?._all || 0,
      depensesTotal: depensesJour._sum?.montant || 0,
      nbDepenses: depensesJour._count?._all || 0,
      soldeNet:
        (ventesJour._sum?.montantCash || 0) - (depensesJour._sum?.montant || 0),
      sessionActive: !!sessionActive,
      sessionId: sessionActive?.id || null,
      fondInitial: sessionActive?.fondInitial || 0,
    };
  }
}
