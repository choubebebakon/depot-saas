import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsInt, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreatePlatDto {
  @IsString() nom: string;
  @IsNumber() prix: number;
  @IsString() categorie: string;
  @IsOptional() @IsBoolean() disponible?: boolean;
  @IsOptional() @IsInt() tempsPrep?: number;
}

export class CreateTableDto {
  @IsInt() numero: number;
  @IsOptional() @IsString() nom?: string;
  @IsInt() capacite: number;
}

export class CreateCommandeDto {
  @IsOptional() @IsString() tableId?: string;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() serveurId?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() notes?: string;
  lignes: { platId: string; quantite: number; note?: string }[];
}

export class CreateCompositionDto {
  @IsString() commandeId: string;
  @IsString() contenant: string;
  @IsString() parfums: string;
  @IsOptional() @IsString() supplements?: string;
  @IsNumber() prix: number;
}

@Injectable()
export class GlacierService {
  constructor(private prisma: PrismaService) {}

  async findAllPlats(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.nom = { contains: pagination.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.plat.findMany({ where, skip, take: limit, orderBy: { categorie: 'asc' } }),
      this.prisma.plat.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createPlat(tenantId: string, dto: CreatePlatDto) {
    return this.prisma.plat.create({ data: { ...dto, tenantId } });
  }

  async findAllTables(tenantId: string) {
    return this.prisma.table.findMany({ where: { tenantId }, orderBy: { numero: 'asc' }, include: { commandes: { where: { statut: { not: 'PAYE' } } } } });
  }

  async createTable(tenantId: string, dto: CreateTableDto) {
    return this.prisma.table.create({ data: { ...dto, tenantId, numero: dto.numero.toString() } });
  }

  async updateTableStatut(id: string, statut: string) {
    return this.prisma.table.update({ where: { id }, data: { statut: statut as any } });
  }

  async findAllCommandes(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.commande.findMany({
        where, skip, take: limit,
        include: { lignes: { include: { plat: true } }, table: true, compositionGlace: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commande.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createCommande(tenantId: string, dto: CreateCommandeDto) {
    const total = 0;
    const commande = await this.prisma.commande.create({
      data: {
        tenantId,
        tableId: dto.tableId,
        clientId: dto.clientId,
        serveurId: dto.serveurId,
        type: (dto.type as any) || 'SUR_PLACE',
        notes: dto.notes,
        total,
        lignes: {
          create: dto.lignes.map(l => ({
            platId: l.platId,
            quantite: l.quantite,
            note: l.note,
          })),
        },
      },
      include: { lignes: { include: { plat: true } }, table: true },
    });

    const coutTotal = commande.lignes.reduce((s, l) => s + (l.plat?.prix || 0) * l.quantite, 0);
    return this.prisma.commande.update({ where: { id: commande.id }, data: { total: coutTotal }, include: { lignes: { include: { plat: true } }, table: true, compositionGlace: true } });
  }

  async findAllCompositions(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.compositionGlace.findMany({ where, skip, take: limit, include: { commande: { include: { lignes: { include: { plat: true } } } } }, orderBy: { id: 'desc' } }),
      this.prisma.compositionGlace.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createComposition(tenantId: string, dto: CreateCompositionDto) {
    const commande = await this.prisma.commande.findUnique({ where: { id: dto.commandeId } });
    if (!commande || commande.tenantId !== tenantId) {
      throw new NotFoundException('Commande introuvable');
    }
    return this.prisma.compositionGlace.create({ data: { ...dto, tenantId }, include: { commande: true } });
  }

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const commandesJour = await this.prisma.commande.findMany({ where: { tenantId, createdAt: { gte: today, lt: tomorrow } } });
    const recettesJour = commandesJour.reduce((s, c) => s + c.total, 0);
    const platsActifs = await this.prisma.plat.count({ where: { tenantId, disponible: true } });
    const tablesOccupees = await this.prisma.table.count({ where: { tenantId, statut: 'OCCUPEE' } });
    const totalCompositions = await this.prisma.compositionGlace.count({ where: { tenantId } });

    return { commandesJour: commandesJour.length, recettesJour, platsActifs, tablesOccupees, totalCompositions };
  }
}
