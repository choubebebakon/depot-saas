import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateLivreDto {
  @IsString() articleId: string;
  @IsOptional() @IsString() isbn?: string;
  @IsOptional() @IsString() auteur?: string;
  @IsOptional() @IsString() editeur?: string;
  @IsOptional() @IsInt() anneeParution?: number;
  @IsOptional() @IsString() genre?: string;
  @IsOptional() @IsString() langue?: string;
  @IsOptional() @IsInt() nbPages?: number;
}

export class CreateCommandeSpecialeDto {
  @IsString() clientId: string;
  @IsString() designation: string;
  @IsOptional() @IsString() isbn?: string;
  @IsOptional() @IsInt() @Min(1) quantite?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() dateArrivee?: string;
}

@Injectable()
export class LibrairieService {
  constructor(private prisma: PrismaService) {}

  async findAllLivres(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [
        { auteur: { contains: pagination.search, mode: 'insensitive' } },
        { genre: { contains: pagination.search, mode: 'insensitive' } },
        { article: { nom: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.livreDetail.findMany({
        where, skip, take: limit,
        include: { article: { include: { stocks: true } } },
        orderBy: { genre: 'asc' },
      }),
      this.prisma.livreDetail.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createLivre(tenantId: string, dto: CreateLivreDto) {
    const article = await this.prisma.article.findUnique({ where: { id: dto.articleId } });
    if (!article || article.tenantId !== tenantId) {
      throw new NotFoundException('Article introuvable');
    }
    return this.prisma.livreDetail.create({
      data: { ...dto, tenantId },
      include: { article: true },
    });
  }

  async findAllCommandes(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.commandeSpeciale.findMany({
        where, skip, take: limit,
        include: { client: true },
        orderBy: { dateCommande: 'desc' },
      }),
      this.prisma.commandeSpeciale.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createCommande(tenantId: string, dto: CreateCommandeSpecialeDto) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client || client.tenantId !== tenantId) {
      throw new NotFoundException('Client introuvable');
    }
    return this.prisma.commandeSpeciale.create({
      data: { ...dto, quantite: dto.quantite || 1, dateArrivee: dto.dateArrivee ? new Date(dto.dateArrivee) : null, tenantId },
      include: { client: true },
    });
  }

  async updateCommandeStatut(id: string, statut: string) {
    return this.prisma.commandeSpeciale.update({ where: { id }, data: { statut: statut as any }, include: { client: true } });
  }

  async getStats(tenantId: string) {
    const totalLivres = await this.prisma.livreDetail.count({ where: { tenantId } });
    const totalEnAttente = await this.prisma.commandeSpeciale.count({ where: { tenantId, statut: 'EN_ATTENTE' } });
    const totalArrivees = await this.prisma.commandeSpeciale.count({ where: { tenantId, statut: 'ARRIVE' } });
    const commandesRecent = await this.prisma.commandeSpeciale.count({ where: { tenantId, dateCommande: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } });
    return { totalLivres, totalEnAttente, totalArrivees, commandes30j: commandesRecent };
  }
}
