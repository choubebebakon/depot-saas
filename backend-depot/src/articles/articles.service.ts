import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Vérifie bien le chemin vers ton prisma.service

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) { }

  // Création d'un article
  async create(createArticleDto: any) {
    return this.prisma.article.create({
      data: createArticleDto,
    });
  }

  // Lister tous les articles d'un client (Tenant) spécifique
  async findAllByTenant(tenantId: string) {
    return this.prisma.article.findMany({
      where: { tenantId },
      include: { stocks: true } // On inclut les stocks pour voir les quantités par dépôt
    });
  }

  // Trouver un article précis
  findOne(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: { stocks: true }
    });
  }
}