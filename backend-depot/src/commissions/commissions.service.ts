import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateParametreDto, CalculerCommissionsDto } from './dto/commission.dto';

@Injectable()
export class CommissionsService {
    constructor(private prisma: PrismaService) { }

    // ── Paramètres ────────────────────────────────────────────

    async setParametre(dto: CreateParametreDto) {
        // Un seul paramètre actif par tenant
        const existant = await this.prisma.parametreCommission.findFirst({
            where: { tenantId: dto.tenantId, estActif: true },
        });

        if (existant) {
            return this.prisma.parametreCommission.update({
                where: { id: existant.id },
                data: { taux: dto.taux, description: dto.description || '' },
            });
        }

        return this.prisma.parametreCommission.create({
            data: {
                taux: dto.taux,
                description: dto.description || '',
                tenantId: dto.tenantId,
                estActif: true,
            },
        });
    }

    async getParametre(tenantId: string) {
        return this.prisma.parametreCommission.findFirst({
            where: { tenantId, estActif: true },
        });
    }

    // ── Calcul des commissions ────────────────────────────────

    async calculerCommissions(dto: CalculerCommissionsDto) {
        const parametre = await this.getParametre(dto.tenantId);
        if (!parametre) {
            throw new BadRequestException(
                'Aucun taux de commission configuré. Configurez d\'abord un taux.',
            );
        }

        // Période par défaut = mois en cours
        const maintenant = new Date();
        const periode = dto.periode ||
            `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;

        const [annee, mois] = periode.split('-').map(Number);
        const debut = new Date(annee, mois - 1, 1);
        const fin = new Date(annee, mois, 0, 23, 59, 59, 999);

        // Cherche les commerciaux
        const whereUser: any = {
            tenantId: dto.tenantId,
            role: { in: ['COMMERCIAL', 'VENDEUR', 'CAISSIER'] },
        };
        if (dto.userId) whereUser.id = dto.userId;

        const users = await this.prisma.user.findMany({ where: whereUser });

        const commissions = await Promise.all(
            users.map(async (user) => {
                // Calcule les ventes du commercial sur la période
                const stats = await this.prisma.vente.aggregate({
                    where: {
                        tenantId: dto.tenantId,
                        createurId: user.id,
                        statut: { not: 'ANNULE' },
                        date: { gte: debut, lte: fin },
                    },
                    _sum: { total: true },
                    _count: { id: true },
                });

                const caVentes = stats._sum.total || 0;
                const montantCommission = (caVentes * parametre.taux) / 100;
                const nbVentes = stats._count.id || 0;

                // Ventes tournées
                const statsTournees = await this.prisma.tournee.aggregate({
                    where: {
                        tenantId: dto.tenantId,
                        commercialId: user.id,
                        statut: 'VALIDEE',
                        dateOuverture: { gte: debut, lte: fin },
                    },
                    _count: { id: true },
                });

                // Cherche si commission existe déjà
                const existante = await this.prisma.commission.findUnique({
                    where: { userId_periode: { userId: user.id, periode } },
                });

                if (montantCommission > 0) {
                    if (existante) {
                        await this.prisma.commission.update({
                            where: { id: existante.id },
                            data: { montant: montantCommission, tauxApplique: parametre.taux },
                        });
                    } else {
                        await this.prisma.commission.create({
                            data: {
                                userId: user.id,
                                tenantId: dto.tenantId,
                                montant: montantCommission,
                                tauxApplique: parametre.taux,
                                periode,
                                estPayee: false,
                            },
                        });
                    }
                }

                return {
                    user: { id: user.id, email: user.email, role: user.role },
                    caVentes,
                    nbVentes,
                    nbTournees: statsTournees._count.id || 0,
                    montantCommission,
                    tauxApplique: parametre.taux,
                    periode,
                    estPayee: existante?.estPayee || false,
                };
            })
        );

        return {
            periode,
            taux: parametre.taux,
            commissions: commissions.filter(c => c.caVentes > 0),
            totalCommissions: commissions.reduce((acc, c) => acc + c.montantCommission, 0),
        };
    }

    // ── Historique commissions ────────────────────────────────

    async findCommissions(tenantId: string, periode?: string) {
        return this.prisma.commission.findMany({
            where: {
                tenantId,
                ...(periode ? { periode } : {}),
            },
            include: {
                user: { select: { id: true, email: true, role: true } },
            },
            orderBy: [{ periode: 'desc' }, { montant: 'desc' }],
        });
    }

    async payerCommission(commissionId: string, tenantId: string) {
        const commission = await this.prisma.commission.findFirst({
            where: { id: commissionId, tenantId },
        });
        if (!commission) throw new BadRequestException('Commission introuvable');
        if (commission.estPayee) throw new BadRequestException('Commission déjà payée');

        return this.prisma.commission.update({
            where: { id: commissionId },
            data: { estPayee: true, datePaiement: new Date() },
            include: { user: { select: { email: true, role: true } } },
        });
    }

    // ── Stats globales commissions ────────────────────────────

    async getStats(tenantId: string) {
        const maintenant = new Date();
        const periodeCourante = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;

        const [aPayerAgg, payeesAgg, parametre] = await Promise.all([
            this.prisma.commission.aggregate({
                where: { tenantId, estPayee: false },
                _sum: { montant: true },
                _count: { id: true },
            }),
            this.prisma.commission.aggregate({
                where: { tenantId, estPayee: true, periode: periodeCourante },
                _sum: { montant: true },
            }),
            this.getParametre(tenantId),
        ]);

        return {
            totalAPayer: aPayerAgg._sum.montant || 0,
            nbAPayer: aPayerAgg._count.id || 0,
            totalPayesMois: payeesAgg._sum.montant || 0,
            taux: parametre?.taux || 0,
            periodeCourante,
        };
    }
}