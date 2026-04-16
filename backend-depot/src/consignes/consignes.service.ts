import { Injectable, BadRequestException } from '@nestjs/common';
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
    constructor(private prisma: PrismaService) { }

    // ── Configuration des types de consignes ─────────────────

    async createTypeConsigne(dto: CreateTypeConsigneDto) {
        // Vérifie qu'il n'existe pas déjà pour ce tenant
        const existant = await this.prisma.typeConsigneConfig.findUnique({
            where: { tenantId_type: { tenantId: dto.tenantId, type: dto.type as any } },
        });
        if (existant) {
            throw new BadRequestException(`Le type ${dto.type} existe déjà pour ce tenant.`);
        }

        return this.prisma.typeConsigneConfig.create({
            data: {
                type: dto.type as any,
                valeurXAF: dto.valeurXAF,
                description: dto.description,
                tenantId: dto.tenantId,
            },
        });
    }

    async findTypesConsigne(tenantId: string) {
        return this.prisma.typeConsigneConfig.findMany({
            where: { tenantId },
            orderBy: { type: 'asc' },
        });
    }

    async updateTypeConsigne(id: string, tenantId: string, dto: UpdateTypeConsigneDto) {
        const type = await this.prisma.typeConsigneConfig.findFirst({
            where: { id, tenantId },
        });
        if (!type) throw new BadRequestException('Type de consigne introuvable');

        return this.prisma.typeConsigneConfig.update({
            where: { id },
            data: { valeurXAF: dto.valeurXAF, description: dto.description },
        });
    }

    // ── Inventaire vides au dépôt ─────────────────────────────

    async getInventaireVides(tenantId: string) {
        // Calcule le stock de vides au dépôt par type
        // = total entrées (vides rendus) - total sorties (vides repartis)
        const types = await this.prisma.typeConsigneConfig.findMany({
            where: { tenantId },
        });

        const inventaire = await Promise.all(
            types.map(async (type) => {
                const mouvements = await this.prisma.mouvementConsigne.findMany({
                    where: { typeConsigneId: type.id, tenantId },
                });

                const totalSorties = mouvements
                    .filter(m => m.estSortie)
                    .reduce((acc, m) => acc + m.quantite, 0);

                const totalEntrees = mouvements
                    .filter(m => !m.estSortie)
                    .reduce((acc, m) => acc + m.quantite, 0);

                const stockVides = totalEntrees - totalSorties;

                return {
                    typeConsigne: type,
                    stockVides: Math.max(0, stockVides),
                    totalSorties,
                    totalEntrees,
                    valeurTotale: Math.max(0, stockVides) * type.valeurXAF,
                };
            })
        );

        return inventaire;
    }

    // ── Portefeuille consignes par client ─────────────────────

    async getPortefeuilleClient(clientId: string, tenantId: string) {
        const portefeuille = await this.prisma.portefeuilleConsigne.findMany({
            where: { clientId },
            include: {
                typeConsigne: true,
                client: true,
            },
        });

        // Calcule la valeur totale des consignes dues
        const valeurTotale = portefeuille.reduce(
            (acc, p) => acc + p.quantite * p.typeConsigne.valeurXAF,
            0
        );

        return { portefeuille, valeurTotale };
    }

    async getAllPortefeuilles(tenantId: string) {
        const clients = await this.prisma.client.findMany({
            where: { tenantId },
            include: {
                portefeuilleConsignes: {
                    include: { typeConsigne: true },
                    where: { quantite: { gt: 0 } },
                },
            },
        });

        return clients
            .filter(c => c.portefeuilleConsignes.length > 0)
            .map(c => ({
                client: { id: c.id, nom: c.nom, telephone: c.telephone },
                consignes: c.portefeuilleConsignes,
                valeurTotale: c.portefeuilleConsignes.reduce(
                    (acc, p) => acc + p.quantite * p.typeConsigne.valeurXAF,
                    0
                ),
            }));
    }

    // ── Mouvement de consigne ─────────────────────────────────

    async enregistrerMouvement(dto: MouvementConsigneDto) {
        const typeConsigne = await this.prisma.typeConsigneConfig.findFirst({
            where: { id: dto.typeConsigneId, tenantId: dto.tenantId },
        });
        if (!typeConsigne) throw new BadRequestException('Type de consigne introuvable');

        return await this.prisma.$transaction(async (tx) => {
            // Créer le mouvement
            const mouvement = await tx.mouvementConsigne.create({
                data: {
                    quantite: dto.quantite,
                    estSortie: dto.estSortie,
                    motif: dto.motif,
                    typeConsigneId: dto.typeConsigneId,
                    venteId: dto.venteId || null,
                    tenantId: dto.tenantId,
                },
                include: { typeConsigne: true },
            });

            // Mettre à jour le portefeuille client si applicable
            if (dto.clientId) {
                const portefeuille = await tx.portefeuilleConsigne.findUnique({
                    where: {
                        clientId_typeConsigneId: {
                            clientId: dto.clientId,
                            typeConsigneId: dto.typeConsigneId,
                        },
                    },
                });

                if (portefeuille) {
                    const newQte = dto.estSortie
                        ? portefeuille.quantite + dto.quantite  // client a plus de vides à rendre
                        : Math.max(0, portefeuille.quantite - dto.quantite); // client rend des vides

                    await tx.portefeuilleConsigne.update({
                        where: { id: portefeuille.id },
                        data: { quantite: newQte },
                    });
                } else if (dto.estSortie) {
                    // Crée le portefeuille si première sortie
                    await tx.portefeuilleConsigne.create({
                        data: {
                            clientId: dto.clientId,
                            typeConsigneId: dto.typeConsigneId,
                            quantite: dto.quantite,
                        },
                    });
                }
            }

            return mouvement;
        });
    }

    // ── Traiter une vente avec consignes ──────────────────────

    async traiterVenteConsignes(dto: VenteAvecConsignesDto) {
        return await this.prisma.$transaction(async (tx) => {
            let caution = 0;
            const mouvements: MouvementConsigne[] = [];

            for (const ligne of dto.lignesConsignes) {
                const typeConsigne = await tx.typeConsigneConfig.findUnique({
                    where: { id: ligne.typeConsigneId },
                });
                if (!typeConsigne) continue;

                const netSortie = ligne.quantiteSortie - ligne.quantiteRendue;

                if (ligne.quantiteSortie > 0) {
                    // Mouvement sortie (emballages qui partent)
                    const mvtSortie = await tx.mouvementConsigne.create({
                        data: {
                            quantite: ligne.quantiteSortie,
                            estSortie: true,
                            motif: `Vente — emballages sortis`,
                            typeConsigneId: ligne.typeConsigneId,
                            venteId: dto.venteId,
                            tenantId: dto.tenantId,
                        },
                    });
                    mouvements.push(mvtSortie);
                }

                if (ligne.quantiteRendue > 0) {
                    // Mouvement entrée (vides rendus)
                    const mvtEntree = await tx.mouvementConsigne.create({
                        data: {
                            quantite: ligne.quantiteRendue,
                            estSortie: false,
                            motif: `Vente — vides rendus`,
                            typeConsigneId: ligne.typeConsigneId,
                            venteId: dto.venteId,
                            tenantId: dto.tenantId,
                        },
                    });
                    mouvements.push(mvtEntree);
                }

                // Caution = net sortie × valeur consigne
                if (netSortie > 0) {
                    caution += netSortie * typeConsigne.valeurXAF;
                }

                // Mise à jour portefeuille client
                if (dto.clientId && netSortie !== 0) {
                    const portefeuille = await tx.portefeuilleConsigne.findUnique({
                        where: {
                            clientId_typeConsigneId: {
                                clientId: dto.clientId,
                                typeConsigneId: ligne.typeConsigneId,
                            },
                        },
                    });

                    if (portefeuille) {
                        const newQte = Math.max(0, portefeuille.quantite + netSortie);
                        await tx.portefeuilleConsigne.update({
                            where: { id: portefeuille.id },
                            data: { quantite: newQte },
                        });
                    } else if (netSortie > 0) {
                        await tx.portefeuilleConsigne.create({
                            data: {
                                clientId: dto.clientId,
                                typeConsigneId: ligne.typeConsigneId,
                                quantite: netSortie,
                            },
                        });
                    }
                }
            }

            return { mouvements, caution };
        });
    }

    // ── Rendu sans achat ──────────────────────────────────────

    async renduSansAchat(dto: RenduSansAchatDto) {
        const typeConsigne = await this.prisma.typeConsigneConfig.findFirst({
            where: { id: dto.typeConsigneId, tenantId: dto.tenantId },
        });
        if (!typeConsigne) throw new BadRequestException('Type de consigne introuvable');

        const client = await this.prisma.client.findFirst({
            where: { id: dto.clientId, tenantId: dto.tenantId },
        });
        if (!client) throw new BadRequestException('Client introuvable');

        const montantRembourse = dto.estRemboursementCash
            ? dto.quantite * typeConsigne.valeurXAF
            : 0;

        return await this.prisma.$transaction(async (tx) => {
            // Mouvement consigne (entrée de vides)
            const mouvement = await tx.mouvementConsigne.create({
                data: {
                    quantite: dto.quantite,
                    estSortie: false,
                    estRemboursementCash: dto.estRemboursementCash,
                    montantRembourse,
                    motif: dto.estRemboursementCash
                        ? `Rendu sans achat — remboursement cash`
                        : `Rendu sans achat — avoir emballage`,
                    typeConsigneId: dto.typeConsigneId,
                    tenantId: dto.tenantId,
                },
                include: { typeConsigne: true },
            });

            // Mise à jour portefeuille client
            const portefeuille = await tx.portefeuilleConsigne.findUnique({
                where: {
                    clientId_typeConsigneId: {
                        clientId: dto.clientId,
                        typeConsigneId: dto.typeConsigneId,
                    },
                },
            });

            if (portefeuille) {
                await tx.portefeuilleConsigne.update({
                    where: { id: portefeuille.id },
                    data: { quantite: Math.max(0, portefeuille.quantite - dto.quantite) },
                });
            }

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

    async getHistorique(tenantId: string, limit = 100) {
        return this.prisma.mouvementConsigne.findMany({
            where: { tenantId },
            include: { typeConsigne: true, vente: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // ── Stats globales consignes ──────────────────────────────

    async getStats(tenantId: string) {
        const inventaire = await this.getInventaireVides(tenantId);
        const portefeuilles = await this.getAllPortefeuilles(tenantId);

        const totalVidesDepot = inventaire.reduce((acc, i) => acc + i.stockVides, 0);
        const valeurVidesDepot = inventaire.reduce((acc, i) => acc + i.valeurTotale, 0);
        const totalDuClients = portefeuilles.reduce((acc, p) => acc + p.valeurTotale, 0);
        const nbClientsAvecConsignes = portefeuilles.length;

        // Remboursements cash du mois
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);

        const remboursements = await this.prisma.mouvementConsigne.aggregate({
            where: {
                tenantId,
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
