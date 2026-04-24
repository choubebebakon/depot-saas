import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatutCommande } from '@prisma/client';
import { CreateCommandeDto } from './dto/create-commande.dto';

@Injectable()
export class CommandesService {
  constructor(private prisma: PrismaService) { }

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException('depotId est obligatoire pour isoler les commandes du depot actif.');
    }

    return depotId;
  }

  /**
   * Analyse les stocks et identifie les produits sous le seuil critique
   * pour proposer une liste de réapprovisionnement globale.
   */
  async genererSuggestions(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    // 1. Récupérer tous les stocks avec leurs articles (incluant le seuil critique par défaut)
    const stocks = await this.prisma.stock.findMany({
      where: {
        depot: { tenantId },
        depotId: selectedDepotId,
      },
      include: {
        article: {
          include: { marque: true }
        },
      },
    });

    // 2. Filtrer les articles dont la quantité est <= seuil critique (spécifique au dépôt ou global)
    const suggestions = stocks.filter(s => {
      const seuil = s.seuilCritique ?? s.article.seuilCritique;
      return s.quantite <= seuil;
    });

    return suggestions.map(s => ({
      articleId: s.articleId,
      designation: s.article.designation,
      quantiteActuelle: s.quantite,
      seuilCritique: s.seuilCritique ?? s.article.seuilCritique,
      enAlerte: s.quantite <= (s.seuilCritique ?? s.article.seuilCritique),
      prixAchatEstime: s.article.prixAchat,
      depotId: s.depotId,
    }));
  }

  /**
   * Crée un brouillon de bon de commande.
   */
  async createCommande(dto: CreateCommandeDto, actor: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Calcul du total
      const total = dto.lignes.reduce((acc, l) => acc + (l.quantite * l.prixAchatUnit), 0);

      // 2. Création de l'entête
      const commande = await tx.commandeFournisseur.create({
        data: {
          reference: dto.reference,
          statut: StatutCommande.BROUILLON,
          total,
          note: dto.note,
          fournisseurId: dto.fournisseurId,
          depotId: dto.depotId,
          tenantId: actor.tenantId,
          createurId: actor.userId,
          lignes: {
            create: dto.lignes.map(l => ({
              articleId: l.articleId,
              quantite: l.quantite,
              prixAchatUnit: l.prixAchatUnit,
            })),
          },
        },
        include: {
          lignes: { include: { article: true } },
          fournisseur: true,
          depot: true,
        },
      });

      return commande;
    });
  }

  async findAll(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    return this.prisma.commandeFournisseur.findMany({
      where: { tenantId, depotId: selectedDepotId },
      include: { fournisseur: true, depot: true, createur: true },
      orderBy: { dateCommande: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    return this.prisma.commandeFournisseur.findFirst({
      where: { id, tenantId, depotId: selectedDepotId },
      include: { 
        lignes: { include: { article: true } }, 
        fournisseur: true, 
        depot: true 
      },
    });
  }

  async updateStatut(id: string, statut: StatutCommande, tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);

    const commande = await this.prisma.commandeFournisseur.findFirst({
      where: { id, tenantId, depotId: selectedDepotId },
      select: { id: true },
    });

    if (!commande) {
      throw new BadRequestException('Commande introuvable pour le depot actif.');
    }

    return this.prisma.commandeFournisseur.update({
      where: { id: commande.id },
      data: { statut },
    });
  }
}
