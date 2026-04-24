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

        const maintenant = new Date();
        const periode = dto.periode || `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
        
        let debut: Date;
        let fin: Date;
        try {
           const [anneeStr, moisStr] = periode.split('-');
           const annee = parseInt(anneeStr, 10) || maintenant.getFullYear();
           const mois = parseInt(moisStr, 10) || (maintenant.getMonth() + 1);

           debut = new Date(annee, mois - 1, 1);
           fin = new Date(annee, mois, 0, 23, 59, 59, 999);
           
           if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
              throw new Error("Invalid date");
           }
        } catch (e) {
           debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
           fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Cherche les commerciaux
        const whereUser: any = {
            tenantId: dto.tenantId,
            role: { in: ['COMMERCIAL', 'VENDEUR', 'CAISSIER'] },
        };
        if (dto.userId) whereUser.id = dto.userId;

        const users = await this.prisma.user.findMany({ where: whereUser });

        const commissions = await Promise.all(
            users.map(async (user) => {
               try {
                // Calcule les ventes du commercial sur la période, en ouvrant les détails JSON
                const ventes = await this.prisma.vente.findMany({
                    where: {
                        tenantId: dto.tenantId,
                        createurId: user.id,
                        statut: { not: 'ANNULE' },
                        date: { gte: debut, lte: fin },
                    },
                    include: { lignes: true }
                });

                let caVentes = 0;
                let caMixte = 0;
                let nbVentes = ventes.length;

                ventes.forEach(vente => {
                   try {
                     vente.lignes.forEach(ligne => {
                          if (ligne.casierMixte && ligne.composition) {
                              const comp = typeof ligne.composition === 'string' ? JSON.parse(ligne.composition) : ligne.composition;
                              if (Array.isArray(comp)) {
                                   comp.forEach(sub => {
                                        console.log('Calcul pour la vente ID:', vente.id); // Forcé par demande
                                        let price = Number(sub.prixUnitaire || 0);
                                        if (isNaN(price) || price <= 0) {
                                             const safeQtyTotale = comp.reduce((acc, c) => acc + (Number(c.quantite || 0) || 0), 0);
                                             price = (Number(ligne.total || 0) || 0) / (Number(ligne.quantite || 1) || 1) / (safeQtyTotale || 1);
                                        }
                                        const subLigneTotal = price * Number(sub.quantite || 0);
                                        const totalPourCasier = subLigneTotal * Number(ligne.quantite || 1);
                                        caVentes += totalPourCasier;
                                        caMixte += totalPourCasier;
                                   });
                              }
                          } else {
                              caVentes += Number(ligne.total || 0);
                          }
                     });
                   } catch (err) {
                      console.error(`[COMMISSION] Erreur de parsing sur la vente ${vente.id} (${vente.reference})`, err);
                   }
                });

                const montantCommission = (caVentes * parametre.taux) / 100;

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
             } catch (err) {
                console.error(`[COMMISSION] Crash complet sur l'utilisateur ${user.id} (${user.email}):`, err);
                return null;
             }
            })
        );

        const validCommissions = commissions.filter(c => c !== null);

        return {
            periode,
            taux: parametre.taux,
            commissions: validCommissions.filter(c => c.caVentes > 0),
            totalCommissions: validCommissions.reduce((acc, c) => acc + c.montantCommission, 0),
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
