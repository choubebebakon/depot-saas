import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutCommande } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';

@Injectable()
export class CommandesService {
  constructor(private prisma: PrismaService) {}

  private requireDepotId(depotId?: string) {
    if (!depotId) {
      throw new BadRequestException(
        'depotId est obligatoire pour isoler les commandes du depot actif.',
      );
    }
    return depotId;
  }

  private canTransition(from: StatutCommande, to: StatutCommande) {
    if (from === to) return true;
    const transitions: Record<StatutCommande, StatutCommande[]> = {
      BROUILLON: [StatutCommande.ENVOYE, StatutCommande.ANNULE],
      ENVOYE: [StatutCommande.RECU, StatutCommande.ANNULE],
      RECU: [],
      ANNULE: [],
    };
    return transitions[from].includes(to);
  }

  async genererSuggestions(tenantId: string, depotId?: string) {
    const selectedDepotId = this.requireDepotId(depotId);
    const stocks = await this.prisma.stock.findMany({
      where: {
        depot: { tenantId },
        depotId: selectedDepotId,
      },
      include: {
        article: { include: { marque: true } },
      },
    });

    const suggestions = stocks.filter((s) => {
      const seuil = s.seuilCritique ?? s.article.seuilCritique;
      return s.quantite <= seuil;
    });

    return suggestions.map((s) => ({
      articleId: s.articleId,
      designation: s.article.designation,
      quantiteActuelle: s.quantite,
      seuilCritique: s.seuilCritique ?? s.article.seuilCritique,
      enAlerte: s.quantite <= (s.seuilCritique ?? s.article.seuilCritique),
      prixAchatEstime: s.article.prixAchat,
      depotId: s.depotId,
    }));
  }

  async createCommande(dto: CreateCommandeDto, actor: any) {
    if (!actor?.tenantId || !actor?.depotId || !actor?.userId) {
      throw new BadRequestException('Contexte utilisateur incomplet pour créer la commande.');
    }
    const depotId = this.requireDepotId(actor.depotId);

    if (!dto.lignes?.length) {
      throw new BadRequestException('Une commande doit contenir au moins une ligne.');
    }

    const seenArticles = new Set<string>();
    for (const ligne of dto.lignes) {
      if (seenArticles.has(ligne.articleId)) {
        throw new BadRequestException(
          `L'article ${ligne.articleId} apparaît plusieurs fois dans la commande.`,
        );
      }
      seenArticles.add(ligne.articleId);
      if (!Number.isInteger(ligne.quantite) || ligne.quantite <= 0) {
        throw new BadRequestException('La quantité commandée doit être un entier strictement positif.');
      }
      if (!Number.isFinite(ligne.prixAchatUnit) || ligne.prixAchatUnit < 0) {
        throw new BadRequestException("Le prix d'achat unitaire est invalide.");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const depot = await tx.depot.findFirst({
        where: { id: depotId, tenantId: actor.tenantId, isArchived: false },
        select: { id: true },
      });
      if (!depot) {
        throw new BadRequestException('Dépôt invalide ou inaccessible.');
      }

      const fournisseur = await tx.fournisseur.findFirst({
        where: {
          id: dto.fournisseurId,
          tenantId: actor.tenantId,
          depotId,
        },
        select: { id: true },
      });
      if (!fournisseur) {
        throw new BadRequestException('Fournisseur invalide ou inaccessible pour ce dépôt.');
      }

      const articles = await tx.article.findMany({
        where: {
          tenantId: actor.tenantId,
          id: { in: [...seenArticles] },
        },
        select: { id: true },
      });
      if (articles.length !== seenArticles.size) {
        throw new BadRequestException('Un ou plusieurs articles sont invalides pour ce tenant.');
      }

      const total = dto.lignes.reduce(
        (acc, l) => acc + l.quantite * l.prixAchatUnit,
        0,
      );

      try {
        return await tx.commandeFournisseur.create({
          data: {
            reference: dto.reference.trim(),
            statut: StatutCommande.BROUILLON,
            total,
            note: dto.note?.trim() || null,
            fournisseurId: fournisseur.id,
            depotId,
            tenantId: actor.tenantId,
            createurId: actor.userId,
            lignes: {
              create: dto.lignes.map((l) => ({
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
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('La référence de commande existe déjà.');
        }
        throw error;
      }
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
        depot: true,
      },
    });
  }

  async updateStatut(
    id: string,
    statut: StatutCommande,
    tenantId: string,
    depotId?: string,
  ) {
    const selectedDepotId = this.requireDepotId(depotId);
    if (!Object.values(StatutCommande).includes(statut)) {
      throw new BadRequestException('Statut de commande invalide.');
    }

    const commande = await this.prisma.commandeFournisseur.findFirst({
      where: { id, tenantId, depotId: selectedDepotId },
      select: { id: true, statut: true },
    });

    if (!commande) {
      throw new NotFoundException('Commande introuvable pour le dépôt actif.');
    }
    if (!this.canTransition(commande.statut, statut)) {
      throw new ConflictException(
        `Transition de statut interdite: ${commande.statut} → ${statut}.`,
      );
    }

    return this.prisma.commandeFournisseur.update({
      where: { id: commande.id },
      data: { statut },
    });
  }

  async update(tenantId: string, depotId: string, id: string, dto: UpdateCommandeDto) {
    const selectedDepotId = this.requireDepotId(depotId);
    const commande = await this.prisma.commandeFournisseur.findFirst({
      where: { id, tenantId, depotId: selectedDepotId },
      select: { id: true, statut: true },
    });

    if (!commande) {
      throw new NotFoundException(`Commande ${id} introuvable dans ce dépôt.`);
    }

    if (dto.statut !== undefined && !this.canTransition(commande.statut, dto.statut)) {
      throw new ConflictException(
        `Transition de statut interdite: ${commande.statut} → ${dto.statut}.`,
      );
    }

    const data: Prisma.CommandeFournisseurUpdateInput = {};
    if (dto.statut !== undefined) data.statut = dto.statut;
    if (dto.note !== undefined) data.note = dto.note.trim() || null;
    if (dto.dateReceptionPrev !== undefined) {
      const date = new Date(dto.dateReceptionPrev);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('La date de réception prévue est invalide.');
      }
      data.dateReceptionPrev = date;
    }

    return this.prisma.commandeFournisseur.update({
      where: { id: commande.id },
      data,
    });
  }
}
