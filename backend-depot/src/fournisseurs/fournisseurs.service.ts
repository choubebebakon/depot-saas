import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { CreateReceptionDto } from './dto/create-reception.dto';

@Injectable()
export class FournisseursService {
    constructor(private prisma: PrismaService) { }

    // ── Fournisseurs ─────────────────────────────────────────

    async createFournisseur(dto: CreateFournisseurDto) {
        return this.prisma.fournisseur.create({
            data: { nom: dto.nom, telephone: dto.telephone, tenantId: dto.tenantId },
        });
    }

    async findAllFournisseurs(tenantId: string) {
        return this.prisma.fournisseur.findMany({
            where: { tenantId },
            include: { _count: { select: { receptions: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ── Réceptions ────────────────────────────────────────────

    async createReception(dto: CreateReceptionDto) {
        return await this.prisma.$transaction(async (tx) => {

            // 1. Calcul du total de la réception (payant seulement, pas gratuits)
            let totalReception = 0;
            for (const ligne of dto.lignes) {
                totalReception += ligne.prixAchatUnitaire * ligne.quantiteLivree;
            }

            // 2. Calcul de la dette fournisseur
            const montantDette = Math.max(0, totalReception - dto.montantPaye);

            // 3. Référence unique de réception
            const count = await tx.receptionFournisseur.count({
                where: { tenantId: dto.tenantId },
            });
            const reference = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

            // 4. Créer la réception
            const reception = await tx.receptionFournisseur.create({
                data: {
                    reference,
                    statut: 'VALIDEE',
                    modePaiement: dto.modePaiement as any,
                    montantPaye: dto.montantPaye,
                    montantDette,
                    fournisseurId: dto.fournisseurId,
                    siteId: dto.siteId,
                    tenantId: dto.tenantId,
                    lignes: {
                        create: dto.lignes.map(l => ({
                            articleId: l.articleId,
                            quantiteLivree: l.quantiteLivree,
                            quantiteGratuite: l.quantiteGratuite,
                            prixAchatUnitaire: l.prixAchatUnitaire,
                        })),
                    },
                },
                include: { lignes: true },
            });

            // 5. Mise à jour des stocks (livré + gratuit)
            for (const ligne of dto.lignes) {
                const totalQte = ligne.quantiteLivree + ligne.quantiteGratuite;
                if (totalQte <= 0) continue;

                // Upsert du stock : crée si n'existe pas, incrémente sinon
                const stockExist = await tx.stock.findUnique({
                    where: { articleId_siteId: { articleId: ligne.articleId, siteId: dto.siteId } },
                });

                if (stockExist) {
                    await tx.stock.update({
                        where: { id: stockExist.id },
                        data: { quantite: { increment: totalQte } },
                    });
                } else {
                    await tx.stock.create({
                        data: { articleId: ligne.articleId, siteId: dto.siteId, quantite: totalQte },
                    });
                }

                // Mouvement stock ENTREE
                await tx.mouvementStock.create({
                    data: {
                        type: 'ENTREE',
                        quantite: totalQte,
                        motif: `Réception ${reference}`,
                        articleId: ligne.articleId,
                        siteId: dto.siteId,
                        tenantId: dto.tenantId,
                    },
                });

                // Si quantité gratuite → mouvement SORTIE_GRATUITE séparé pour la comptabilité
                if (ligne.quantiteGratuite > 0) {
                    await tx.mouvementStock.create({
                        data: {
                            type: 'SORTIE_GRATUITE',
                            quantite: ligne.quantiteGratuite,
                            motif: `Gratuit réception ${reference}`,
                            articleId: ligne.articleId,
                            siteId: dto.siteId,
                            tenantId: dto.tenantId,
                        },
                    });
                }
            }

            // 6. Mise à jour de la dette fournisseur
            if (montantDette > 0) {
                await tx.fournisseur.update({
                    where: { id: dto.fournisseurId },
                    data: { solde: { increment: montantDette } },
                });
            }

            return reception;
        });
    }

    async findAllReceptions(tenantId: string, siteId?: string) {
        return this.prisma.receptionFournisseur.findMany({
            where: { tenantId, ...(siteId ? { siteId } : {}) },
            include: {
                fournisseur: true,
                site: true,
                lignes: { include: { article: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async statsFournisseurs(tenantId: string) {
        const dettes = await this.prisma.fournisseur.aggregate({
            where: { tenantId, solde: { gt: 0 } },
            _sum: { solde: true },
            _count: { id: true },
        });

        const receptions = await this.prisma.receptionFournisseur.count({
            where: { tenantId },
        });

        return {
            totalDette: dettes._sum.solde || 0,
            nbFournisseursEnDette: dettes._count.id || 0,
            totalReceptions: receptions,
        };
    }
}