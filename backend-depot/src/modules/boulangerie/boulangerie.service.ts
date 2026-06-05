import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateRecetteDto {
  @IsString() articleId: string;
  @IsString() nom: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsInt() tempsPrep?: number;
  @IsOptional() @IsInt() tempsCuisson?: number;
  @IsOptional() @IsInt() temperature?: number;
  @IsOptional() @IsInt() portionsUnite?: number;
}

export class AddIngredientDto {
  @IsString() articleId: string;
  @IsNumber() quantite: number;
  @IsString() unite: string;
}

export class CreateProductionDto {
  @IsString() recetteId: string;
  @IsOptional() date?: string;
  @IsInt() @Min(0) quantiteProduite: number;
  @IsOptional() @IsInt() quantiteVendue?: number;
  @IsOptional() @IsInt() quantiteInvendue?: number;
  @IsOptional() @IsNumber() coutProduction?: number;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class BoulangerieService {
  constructor(private prisma: PrismaService) {}

  async findAllRecettes(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.nom = { contains: pagination.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.recette.findMany({
        where, skip, take: limit,
        include: { article: true, ingredients: { include: { article: true } }, productions: { take: 5, orderBy: { date: 'desc' } } },
        orderBy: { nom: 'asc' },
      }),
      this.prisma.recette.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRecette(tenantId: string, dto: CreateRecetteDto) {
    const article = await this.prisma.article.findUnique({ where: { id: dto.articleId } });
    if (!article || article.tenantId !== tenantId) {
      throw new NotFoundException('Article introuvable');
    }
    return this.prisma.recette.create({
      data: { ...dto, tenantId },
      include: { article: true, ingredients: { include: { article: true } } },
    });
  }

  async getRecette(id: string) {
    const recette = await this.prisma.recette.findUnique({
      where: { id },
      include: { article: true, ingredients: { include: { article: true } }, productions: { orderBy: { date: 'desc' }, take: 20 } },
    });
    if (!recette) throw new NotFoundException('Recette introuvable');
    return recette;
  }

  async addIngredient(recetteId: string, dto: AddIngredientDto) {
    const recette = await this.prisma.recette.findUnique({ where: { id: recetteId } });
    if (!recette) throw new NotFoundException('Recette introuvable');
    return this.prisma.ingredientRecette.create({
      data: { recetteId, ...dto },
      include: { article: true },
    });
  }

  async findAllProduction(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.recette = { nom: { contains: pagination.search, mode: 'insensitive' } };
    }
    const [data, total] = await Promise.all([
      this.prisma.productionJour.findMany({
        where, skip, take: limit,
        include: { recette: { include: { article: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.productionJour.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createProduction(tenantId: string, dto: CreateProductionDto) {
    const recette = await this.prisma.recette.findUnique({ where: { id: dto.recetteId } });
    if (!recette || recette.tenantId !== tenantId) {
      throw new NotFoundException('Recette introuvable');
    }
    const invendue = dto.quantiteInvendue ?? (dto.quantiteProduite - (dto.quantiteVendue || 0));
    return this.prisma.productionJour.create({
      data: { ...dto, tenantId, quantiteInvendue: invendue, date: dto.date ? new Date(dto.date) : new Date() },
      include: { recette: { include: { article: true } } },
    });
  }

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const productionAujourdhui = await this.prisma.productionJour.findMany({
      where: { tenantId, date: { gte: today, lt: tomorrow } },
      include: { recette: true },
    });

    const totalProduit = productionAujourdhui.reduce((s, p) => s + p.quantiteProduite, 0);
    const totalVendu = productionAujourdhui.reduce((s, p) => s + p.quantiteVendue, 0);
    const totalInvendu = productionAujourdhui.reduce((s, p) => s + p.quantiteInvendue, 0);
    const coutTotal = productionAujourdhui.reduce((s, p) => s + (p.coutProduction || 0), 0);

    const totalRecettes = await this.prisma.recette.count({ where: { tenantId } });

    return { totalProduit, totalVendu, totalInvendu, coutTotal, productionsJour: productionAujourdhui.length, totalRecettes };
  }
}
