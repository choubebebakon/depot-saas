import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    // Créer un client
    async create(dto: any) {
        return this.prisma.client.create({
            data: {
                id: dto.id || undefined,
                nom: dto.nom,
                telephone: dto.telephone,
                adresse: dto.adresse,
                plafondCredit: dto.plafondCredit ?? 0,
                tenantId: dto.tenantId,
                createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
            },
        });
    }

    // Liste tous les clients du tenant
    async findAll(tenantId: string) {
        return this.prisma.client.findMany({
            where: { tenantId },
            include: {
                dettes: {
                    where: { statut: { in: ['EN_COURS', 'PARTIELLEMENT_PAYEE'] } },
                },
                _count: { select: { ventes: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Détail d'un client avec son historique complet
    async findOne(id: string, tenantId: string) {
        return this.prisma.client.findFirst({
            where: { id, tenantId },
            include: {
                ventes: {
                    orderBy: { date: 'desc' },
                    take: 20,
                    include: { lignes: { include: { article: true } }, depot: true },
                },
                dettes: { orderBy: { createdAt: 'desc' } },
            },
        });
    }

    // Enregistrer un paiement de dette (remboursement ardoise)
    async payerDette(clientId: string, montant: number, tenantId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id: clientId, tenantId },
            include: {
                dettes: {
                    where: { statut: { in: ['EN_COURS', 'PARTIELLEMENT_PAYEE'] } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!client) throw new BadRequestException('Client introuvable');
        if (montant <= 0) throw new BadRequestException('Montant invalide');
        if (montant > client.soldeCredit)
            throw new BadRequestException(
                `Montant dépasse la dette (${client.soldeCredit} FCFA)`,
            );

        // Impute le paiement sur les dettes les plus anciennes en premier
        let restantAPayer = montant;

        for (const dette of client.dettes) {
            if (restantAPayer <= 0) break;
            const resteDettte = dette.montant - dette.montantPaye;
            const paiementCette = Math.min(restantAPayer, resteDettte);

            const nouveauMontantPaye = dette.montantPaye + paiementCette;
            await this.prisma.detteClient.update({
                where: { id: dette.id },
                data: {
                    montantPaye: nouveauMontantPaye,
                    statut:
                        nouveauMontantPaye >= dette.montant ? 'SOLDEE' : 'PARTIELLEMENT_PAYEE',
                },
            });

            restantAPayer -= paiementCette;
        }

        // Met à jour le solde global du client
        const updatedClient = await this.prisma.client.update({
            where: { id: clientId },
            data: { soldeCredit: { decrement: montant } },
        });

        return {
            message: `Paiement de ${montant} FCFA enregistré`,
            nouveauSolde: updatedClient.soldeCredit,
        };
    }

    // Stats ardoise globale du tenant
    async statsArdoise(tenantId: string) {
        const result = await this.prisma.client.aggregate({
            where: { tenantId, soldeCredit: { gt: 0 } },
            _sum: { soldeCredit: true },
            _count: { id: true },
        });

        return {
            totalDu: result._sum.soldeCredit || 0,
            nbClientsEnDette: result._count.id || 0,
        };
    }
}
