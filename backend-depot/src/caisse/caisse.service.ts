import { Injectable, BadRequestException } from '@nestjs/common';
import { StatutVente } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { OuvrirCaisseDto, FermerCaisseDto, CreateDepenseDto } from './dto/caisse.dto';

@Injectable()
export class CaisseService {
    constructor(private prisma: PrismaService) { }

    // ── Sessions Caisse ──────────────────────────────────────

    async ouvrirSession(dto: OuvrirCaisseDto) {
        // Vérifie qu'il n'y a pas déjà une session ouverte sur ce Depot
        const sessionExistante = await this.prisma.sessionCaisse.findFirst({
            where: { depotId: dto.depotId, tenantId: dto.tenantId, estOuverte: true },
        });

        if (sessionExistante) {
            throw new BadRequestException(
                'Une session de caisse est déjà ouverte sur ce Depot.',
            );
        }

        const session = await this.prisma.sessionCaisse.create({
            data: {
                fondInitial: dto.fondInitial,
                depotId: dto.depotId,
                userId: dto.userId,
                tenantId: dto.tenantId,
                estOuverte: true,
            },
        });

        // Mouvement initial
        await this.prisma.mouvementCaisse.create({
            data: {
                type: 'FOND_INITIAL',
                montant: dto.fondInitial,
                motif: 'Ouverture de caisse',
                sessionId: session.id,
            },
        });

        return session;
    }

    async fermerSession(dto: FermerCaisseDto) {
        const session = await this.prisma.sessionCaisse.findUnique({
            where: { id: dto.sessionId },
            include: { mouvements: true },
        });

        if (!session) throw new BadRequestException('Session introuvable');
        if (!session.estOuverte) throw new BadRequestException('Session déjà fermée');

        // Calcul du solde théorique
        const totalEntrees = session.mouvements
            .filter(m => ['FOND_INITIAL', 'ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE'].includes(m.type))
            .reduce((acc, m) => acc + m.montant, 0);

        const totalSorties = session.mouvements
            .filter(m => ['DECAISSEMENT_DEPENSE', 'DECAISSEMENT_VIDES'].includes(m.type))
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
        return this.prisma.sessionCaisse.findFirst({
            where: { tenantId, depotId, estOuverte: true },
            include: {
                mouvements: { orderBy: { createdAt: 'desc' } },
                user: { select: { email: true, role: true } },
            },
        });
    }

    async getHistorique(tenantId: string, depotId: string) {
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

    async createDepense(dto: any) {
        // Trouve la session active
        const session = await this.prisma.sessionCaisse.findFirst({
            where: { depotId: dto.depotId, tenantId: dto.tenantId, estOuverte: true },
        });

        const depense = await this.prisma.depense.create({
            data: {
                id: dto.id || undefined,
                categorie: dto.categorie,
                montant: dto.montant,
                motif: dto.motif,
                depotId: dto.depotId,
                tenantId: dto.tenantId,
                photoUrl: dto.photoUrl,
                createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
            },
        });

        // Enregistre le mouvement caisse si session active
        if (session) {
            await this.prisma.mouvementCaisse.create({
                data: {
                    type: 'DECAISSEMENT_DEPENSE',
                    montant: dto.montant,
                    motif: `${dto.categorie} — ${dto.motif}`,
                    reference: depense.id,
                    sessionId: session.id,
                    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
                },
            });
        }

        return depense;
    }

    async getDepenses(tenantId: string, depotId: string, dateDebut?: string, dateFin?: string) {
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ventes du jour en cash
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

        // Dépenses du jour
        const depensesJour = await this.prisma.depense.aggregate({
            where: { tenantId, depotId, createdAt: { gte: today } },
            _sum: { montant: true },
            _count: { _all: true },
        });

        // Session active
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
            soldeNet: (ventesJour._sum?.montantCash || 0) - (depensesJour._sum?.montant || 0),
            sessionActive: !!sessionActive,
            sessionId: sessionActive?.id || null,
            fondInitial: sessionActive?.fondInitial || 0,
        };
    }
}
