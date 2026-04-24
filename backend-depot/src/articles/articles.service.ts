import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: any) {
    const { tenantId, designation, format, prixBouteille, margeBouteille, prixVente, prixAchat } = dto;

    if (!tenantId) throw new BadRequestException("ID Entreprise (tenantId) manquant.");

    // Déterminer le multiplicateur selon le format (Casier = 12, Pack = 6)
    const multiplicateur = format.toUpperCase().includes('CASIER') ? 12 :
      format.toUpperCase().includes('PACK') ? 6 : 1;

    // Calcul automatique du prix de vente final (Gros)
    // On priorise le calcul manuel (bouteille + marge) si disponible, sinon on prend le prixVente brut
    const prixVenteFinal = prixBouteille
      ? (Number(prixBouteille) + Number(margeBouteille || 0)) * multiplicateur
      : prixVente;

    return this.prisma.$transaction(async (tx) => {
      // 1. Création de l'article dans le catalogue
      const article = await tx.article.create({
        data: {
          designation,
          format: format || "CASIER",
          prixVente: prixVenteFinal,
          prixAchat: prixAchat || 0,
          uniteParCasier: multiplicateur,
          estConsigne: dto.estConsigne || false,
          tenantId,
          familleId: dto.familleId,
          marqueId: dto.marqueId,
          seuilCritique: dto.seuilCritique || 5,
        },
      });

      // 2. Initialisation automatique du stock à 0 sur TOUS les depots (dépôts) du client
      const depots = await tx.depot.findMany({ where: { tenantId } });
      if (depots.length > 0) {
        await tx.stock.createMany({
          data: depots.map(Depot => ({
            articleId: article.id,
            depotId: Depot.id,
            quantite: 0,
          })),
          skipDuplicates: true,
        });
      }

      return article;
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.article.findMany({
      where: { tenantId },
      include: {
        stocks: { include: { depot: true } },
        famille: true,
        marque: true
      },
      orderBy: { designation: 'asc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: { stocks: true, famille: true, marque: true }
    });
  }
}
