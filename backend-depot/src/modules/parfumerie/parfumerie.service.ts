import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateProduitCosmetiqueDto {
  @IsString() articleId: string;
  @IsString() marque: string;
  @IsOptional() @IsString() contenance?: string;
  @IsOptional() @IsString() typesPeau?: string;
  @IsOptional() @IsString() ingredients?: string;
  @IsOptional() @IsString() certifications?: string;
  @IsString() categorie: string;
}

export class AjouterPointsDto {
  @IsString() clientId: string;
  @IsInt() @Min(1) points: number;
  @IsString() motif: string;
}

@Injectable()
export class ParfumerieService {
  constructor(private prisma: PrismaService) {}

  // ── PRODUITS COSMETIQUES ─────────────────────────────────────

  async findAllProduits(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [
        { marque: { contains: pagination.search, mode: 'insensitive' } },
        { categorie: { contains: pagination.search, mode: 'insensitive' } },
        { article: { nom: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.produitCosmetique.findMany({
        where, skip, take: limit,
        include: { article: { include: { stocks: true } } },
        orderBy: { categorie: 'asc' },
      }),
      this.prisma.produitCosmetique.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createProduit(tenantId: string, dto: CreateProduitCosmetiqueDto) {
    const article = await this.prisma.article.findUnique({ where: { id: dto.articleId } });
    if (!article || article.tenantId !== tenantId) {
      throw new NotFoundException('Article introuvable');
    }
    return this.prisma.produitCosmetique.create({
      data: { ...dto, tenantId },
      include: { article: true },
    });
  }

  // ── FIDELITE ─────────────────────────────────────────────────

  async getFideliteClient(tenantId: string, clientId: string) {
    const programme = await this.prisma.programmeFidelite.findUnique({
      where: { clientId },
      include: { client: true, historique: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!programme || programme.tenantId !== tenantId) {
      return null;
    }
    return programme;
  }

  async ajouterPoints(tenantId: string, dto: AjouterPointsDto) {
    let programme = await this.prisma.programmeFidelite.findUnique({ where: { clientId: dto.clientId } });

    if (!programme) {
      programme = await this.prisma.programmeFidelite.create({
        data: { tenantId, clientId: dto.clientId, points: 0, totalDepense: 0 },
      });
    }

    const nouveauTotal = programme.points + dto.points;
    const niveau = this.calculerNiveau(nouveauTotal);

    await this.prisma.historiqueFidelite.create({
      data: { fideliteId: programme.id, points: dto.points, motif: dto.motif },
    });

    return this.prisma.programmeFidelite.update({
      where: { id: programme.id },
      data: { points: nouveauTotal, niveau },
      include: { client: true },
    });
  }

  async getFideliteStats(tenantId: string) {
    const programmes = await this.prisma.programmeFidelite.findMany({
      where: { tenantId },
      include: { client: true },
    });

    const totalPoints = programmes.reduce((s, p) => s + p.points, 0);
    const repartitionNiveaux = programmes.reduce((acc, p) => {
      acc[p.niveau] = (acc[p.niveau] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClientsFideles: programmes.length,
      totalPointsDistribues: totalPoints,
      pointsMoyen: programmes.length > 0 ? Math.round(totalPoints / programmes.length) : 0,
      repartitionNiveaux,
    };
  }

  async getTopClients(tenantId: string, limit = 10) {
    return this.prisma.programmeFidelite.findMany({
      where: { tenantId },
      orderBy: { totalDepense: 'desc' },
      take: limit,
      include: { client: true },
    });
  }

  private calculerNiveau(points: number): string {
    if (points >= 1000) return 'PLATINE';
    if (points >= 500) return 'OR';
    if (points >= 200) return 'ARGENT';
    if (points >= 50) return 'BRONZE';
    return 'BRONZE';
  }
}
