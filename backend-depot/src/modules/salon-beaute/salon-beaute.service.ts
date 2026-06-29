import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RdvStatut } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';

// ─── DTOs ──────────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreatePrestationDto {
  @IsString() nom: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) prix: number;
  @IsOptional() @IsNumber() dureeMin?: number;
  @IsOptional() @IsString() categorie?: string;
}

export class CreateRendezVousSalonDto {
  @IsOptional() @IsString() clientId?: string;
  @IsString() nomClient: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() employeId?: string;
  @IsDateString() dateHeure: string;
  @IsOptional() @IsString() notes?: string;
  prestations: Array<{ prestationId: string }>;
}

export class UpdateRdvStatutDto {
  @IsEnum(RdvStatut) statut: RdvStatut;
}

@Injectable()
export class SalonBeauteService {
  constructor(private prisma: PrismaService) {}

  // ── PRESTATIONS ──────────────────────────────────────────────

  async findAllPrestations(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [
        { nom: { contains: pagination.search, mode: 'insensitive' } },
        { categorie: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.prestation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nom: 'asc' },
      }),
      this.prisma.prestation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createPrestation(tenantId: string, dto: CreatePrestationDto) {
    return this.prisma.prestation.create({
      data: { ...dto, tenantId },
    });
  }

  async toggleDisponibilite(id: string, tenantId: string) {
    const prestation = await this.prisma.prestation.findUnique({
      where: { id },
    });
    if (!prestation || prestation.tenantId !== tenantId) {
      throw new BadRequestException('Prestation introuvable');
    }
    return this.prisma.prestation.update({
      where: { id },
      data: { disponible: !prestation.disponible },
    });
  }

  // ── RENDEZ-VOUS ──────────────────────────────────────────────

  async findAllRdv(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [
        { nomClient: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.rendezVousSalon.findMany({
        where,
        skip,
        take: limit,
        include: { lignes: { include: { prestation: true } }, client: true },
        orderBy: { dateHeure: 'desc' },
      }),
      this.prisma.rendezVousSalon.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRdv(tenantId: string, dto: CreateRendezVousSalonDto) {
    const prestations = await this.prisma.prestation.findMany({
      where: {
        id: { in: dto.prestations.map((p) => p.prestationId) },
        tenantId,
      },
    });

    const montantTotal = prestations.reduce((sum, p) => sum + p.prix, 0);

    return this.prisma.rendezVousSalon.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        nomClient: dto.nomClient,
        telephone: dto.telephone,
        employeId: dto.employeId,
        dateHeure: new Date(dto.dateHeure),
        notes: dto.notes,
        montantTotal,
        lignes: {
          create: prestations.map((p) => ({
            prestationId: p.id,
            prix: p.prix,
          })),
        },
      },
      include: { lignes: { include: { prestation: true } } },
    });
  }

  async getRdvToday(tenantId: string) {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    return this.prisma.rendezVousSalon.findMany({
      where: { tenantId, dateHeure: { gte: debut, lte: fin } },
      include: { lignes: { include: { prestation: true } } },
      orderBy: { dateHeure: 'asc' },
    });
  }

  async updateRdvStatut(id: string, tenantId: string, dto: UpdateRdvStatutDto) {
    return this.prisma.rendezVousSalon.update({
      where: { id, tenantId },
      data: { statut: dto.statut },
      include: { lignes: { include: { prestation: true } } },
    });
  }

  // ── STATISTIQUES ─────────────────────────────────────────────

  async getStats(tenantId: string) {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const [rdvAujourdhui, rdvEnCours, recettesJour, clientsMois] =
      await Promise.all([
        this.prisma.rendezVousSalon.count({
          where: { tenantId, dateHeure: { gte: debut, lte: fin } },
        }),
        this.prisma.rendezVousSalon.count({
          where: { tenantId, statut: 'EN_COURS' },
        }),
        this.prisma.rendezVousSalon.aggregate({
          where: {
            tenantId,
            dateHeure: { gte: debut, lte: fin },
            statut: 'TERMINE',
          },
          _sum: { montantTotal: true },
        }),
        this.prisma.rendezVousSalon.groupBy({
          by: ['clientId'],
          where: {
            tenantId,
            dateHeure: { gte: debutMois },
            clientId: { not: null },
          },
          _count: true,
        }),
      ]);

    return {
      rdv_aujourd_hui: rdvAujourdhui,
      rdv_en_cours: rdvEnCours,
      recettes_jour: recettesJour._sum.montantTotal || 0,
      clients_mois: clientsMois.length,
    };
  }
}
