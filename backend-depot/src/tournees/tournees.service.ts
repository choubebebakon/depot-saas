import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
    OuvrirTourneeDto,
    ChargerTourneeDto,
    ClotureCommercialeDto,
    ValidationMagasinierDto,
    CreateTricycleDto,
} from './dto/tournee.dto';

@Injectable()
export class TourneesService {
    constructor(private prisma: PrismaService) { }

    private requireDepotId(depotId?: string) {
        if (!depotId) {
            throw new BadRequestException('depotId est obligatoire pour isoler les tournees du depot actif.');
        }

        return depotId;
    }

    // ── Tricycles ────────────────────────────────────────────

    async createTricycle(dto: CreateTricycleDto) {
        return this.prisma.tricycle.create({
            data: { nom: dto.nom, tenantId: dto.tenantId, estLibre: true },
        });
    }

    async findTricycles(tenantId: string) {
        return this.prisma.tricycle.findMany({
            where: { tenantId },
            include: {
                tournees: {
                    where: { statut: { in: ['OUVERTE', 'CLOTURE_COMMERCIALE'] } },
                    take: 1,
                    include: { commercial: { select: { email: true, nom: true } } },
                },
            },
            orderBy: { nom: 'asc' },
        });
    }

    // ── Ouverture Tournée ────────────────────────────────────

    async ouvrirTournee(dto: OuvrirTourneeDto) {
        // Vérifie que le tricycle est libre
        const tricycle = await this.prisma.tricycle.findFirst({
            where: { id: dto.tricycleId, tenantId: dto.tenantId },
        });

        if (!tricycle) throw new BadRequestException('Tricycle introuvable');
        if (!tricycle.estLibre) {
            throw new BadRequestException(
                'Ce tricycle est déjà en tournée. Clôturez la tournée précédente d\'abord.',
            );
        }

        // Génère la référence
        const count = await this.prisma.tournee.count({ where: { tenantId: dto.tenantId } });
        const annee = new Date().getFullYear();
        const reference = `TRN-${annee}-${String(count + 1).padStart(5, '0')}`;

        // Crée la tournée et bloque le tricycle
        const [tournee] = await this.prisma.$transaction([
            this.prisma.tournee.create({
                data: {
                    reference,
                    statut: 'OUVERTE',
                    depotId: dto.depotId,
                    tricycleId: dto.tricycleId,
                    commercialId: dto.commercialId,
                    tenantId: dto.tenantId,
                },
                include: {
                    tricycle: true,
                    commercial: { select: { email: true, role: true, nom: true } },
                    depot: true,
                },
            }),
            this.prisma.tricycle.update({
                where: { id: dto.tricycleId },
                data: { estLibre: false },
            }),
        ]);

        return tournee;
    }

    // ── Chargement ───────────────────────────────────────────

    async chargerTournee(dto: ChargerTourneeDto) {
        const tournee = await this.prisma.tournee.findFirst({
            where: { id: dto.tourneeId, tenantId: dto.tenantId },
            include: { lignesChargement: true },
        });

        if (!tournee) throw new BadRequestException('Tournée introuvable');
        if (tournee.statut !== 'OUVERTE') {
            throw new BadRequestException('Impossible de charger : tournée non ouverte');
        }

        return await this.prisma.$transaction(async (tx) => {
            for (const ligne of dto.lignes) {
                // Vérifie le stock disponible au dépôt
                const stock = await tx.stock.findUnique({
                    where: {
                        articleId_depotId: {
                            articleId: ligne.articleId,
                            depotId: tournee.depotId,
                        },
                    },
                });

                if (!stock || stock.quantite < ligne.quantiteChargee) {
                    const article = await tx.article.findUnique({ where: { id: ligne.articleId } });
                    throw new BadRequestException(
                        `Stock insuffisant pour ${article?.designation || ligne.articleId}. Disponible: ${stock?.quantite || 0}`,
                    );
                }

                // Déstocke du dépôt
                await tx.stock.update({
                    where: { id: stock.id },
                    data: { quantite: { decrement: ligne.quantiteChargee } },
                });

                // Crée ou met à jour la ligne de chargement
                const existante = await tx.ligneChargement.findFirst({
                    where: { tourneeId: dto.tourneeId, articleId: ligne.articleId },
                });

                if (existante) {
                    await tx.ligneChargement.update({
                        where: { id: existante.id },
                        data: { quantiteChargee: { increment: ligne.quantiteChargee } },
                    });
                } else {
                    await tx.ligneChargement.create({
                        data: {
                            tourneeId: dto.tourneeId,
                            articleId: ligne.articleId,
                            quantiteChargee: ligne.quantiteChargee,
                        },
                    });
                }

                // Mouvement stock TRANSFERT_SORTIE
                await tx.mouvementStock.create({
                    data: {
                        type: 'TRANSFERT_SORTIE',
                        quantite: ligne.quantiteChargee,
                        motif: `Chargement tournée ${tournee.reference}`,
                        articleId: ligne.articleId,
                        depotId: tournee.depotId,
                        tenantId: dto.tenantId,
                        tourneeId: dto.tourneeId,
                    },
                });
            }

            return tx.tournee.findUnique({
                where: { id: dto.tourneeId },
                include: {
                    lignesChargement: { include: { article: true } },
                    commercial: { select: { email: true, nom: true } },
                    depot: true,
                    tricycle: true,
                },
            });
        });
    }

    // ── Clôture Commerciale ──────────────────────────────────

    async clotureCommerciale(dto: ClotureCommercialeDto) {
        const tournee = await this.prisma.tournee.findFirst({
            where: { id: dto.tourneeId, tenantId: dto.tenantId },
        });

        if (!tournee) throw new BadRequestException('Tournée introuvable');
        if (tournee.statut !== 'OUVERTE') {
            throw new BadRequestException('La tournée doit être ouverte pour faire la clôture commerciale');
        }

        // Passe en CLOTURE_COMMERCIALE — attend validation magasinier
        return this.prisma.tournee.update({
            where: { id: dto.tourneeId },
            data: {
                statut: 'CLOTURE_COMMERCIALE',
                cashRemis: dto.cashRemis,
                omRemis: dto.omRemis,
                momoRemis: dto.momoRemis,
                noteCloture: dto.noteCloture,
            },
        });
    }

    // ── Validation Magasinier ────────────────────────────────

    async validerMagasinier(dto: ValidationMagasinierDto) {
        const tournee = await this.prisma.tournee.findFirst({
            where: { id: dto.tourneeId, tenantId: dto.tenantId },
            include: { lignesChargement: { include: { article: true } } },
        });

        if (!tournee) throw new BadRequestException('Tournée introuvable');
        if (tournee.statut !== 'CLOTURE_COMMERCIALE') {
            throw new BadRequestException('La tournée doit être en clôture commerciale');
        }

        return await this.prisma.$transaction(async (tx) => {
            let ecartTotal = 0;

            for (const retour of dto.lignesRetour) {
                const ligne = tournee.lignesChargement.find(
                    (l) => l.articleId === retour.articleId,
                );
                if (!ligne) continue;

                // Calcul de ce qui aurait dû être vendu vs retour réel
                const attenduRetour = ligne.quantiteChargee - ligne.quantiteVendue;
                const ecartLigne = retour.quantiteRetour - attenduRetour;
                ecartTotal += Math.abs(ecartLigne);

                // Met à jour la ligne chargement avec le retour réel
                await tx.ligneChargement.update({
                    where: { id: ligne.id },
                    data: { quantiteRetour: retour.quantiteRetour },
                });

                // Retourne le stock au dépôt
                if (retour.quantiteRetour > 0) {
                    const stockDepot = await tx.stock.findUnique({
                        where: {
                            articleId_depotId: {
                                articleId: retour.articleId,
                                depotId: tournee.depotId,
                            },
                        },
                    });

                    if (stockDepot) {
                        await tx.stock.update({
                            where: { id: stockDepot.id },
                            data: { quantite: { increment: retour.quantiteRetour } },
                        });
                    } else {
                        await tx.stock.create({
                            data: {
                                articleId: retour.articleId,
                                depotId: tournee.depotId,
                                quantite: retour.quantiteRetour,
                            },
                        });
                    }

                    // Mouvement TRANSFERT_ENTREE
                    await tx.mouvementStock.create({
                        data: {
                            type: 'TRANSFERT_ENTREE',
                            quantite: retour.quantiteRetour,
                            motif: `Retour tournée ${tournee.reference}`,
                            articleId: retour.articleId,
                            depotId: tournee.depotId,
                            tenantId: dto.tenantId,
                            tourneeId: dto.tourneeId,
                        },
                    });
                }
            }

            // Libère le tricycle et clôture la tournée
            await tx.tricycle.update({
                where: { id: tournee.tricycleId },
                data: { estLibre: true },
            });

            return tx.tournee.update({
                where: { id: dto.tourneeId },
                data: {
                    statut: 'VALIDEE',
                    dateCloture: new Date(),
                    ecartStock: ecartTotal,
                    noteValidation: dto.noteValidation,
                },
                include: {
                    lignesChargement: { include: { article: true } },
                    commercial: { select: { email: true, nom: true } },
                    tricycle: true,
                    depot: true,
                },
            });
        });
    }

    // ── Lister tournées ──────────────────────────────────────

    async findAll(tenantId: string, depotId?: string, statut?: string) {
        const selectedDepotId = this.requireDepotId(depotId);

        return this.prisma.tournee.findMany({
            where: {
                tenantId,
                depotId: selectedDepotId,
                ...(statut ? { statut: statut as any } : {}),
            },
            include: {
                commercial: { select: { email: true, role: true, nom: true } },
                tricycle: true,
                depot: true,
                lignesChargement: { include: { article: true } },
                _count: { select: { ventes: true } },
            },
            orderBy: { dateOuverture: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string, depotId?: string) {
        const selectedDepotId = this.requireDepotId(depotId);

        return this.prisma.tournee.findFirst({
            where: { id, tenantId, depotId: selectedDepotId },
            include: {
                commercial: { select: { email: true, role: true, nom: true } },
                tricycle: true,
                depot: true,
                lignesChargement: { include: { article: true } },
                ventes: {
                    include: { lignes: { include: { article: true } } },
                    orderBy: { date: 'desc' },
                },
            },
        });
    }

    async statsTournees(tenantId: string) {
        const actives = await this.prisma.tournee.count({
            where: { tenantId, statut: { in: ['OUVERTE', 'CLOTURE_COMMERCIALE'] } },
        });
        const attenteMagasinier = await this.prisma.tournee.count({
            where: { tenantId, statut: 'CLOTURE_COMMERCIALE' },
        });
        const total = await this.prisma.tournee.count({ where: { tenantId } });

        return { actives, attenteMagasinier, total };
    }
}
