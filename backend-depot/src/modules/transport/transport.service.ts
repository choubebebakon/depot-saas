import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsInt, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateVehiculeDto {
  @IsString() immatriculation: string;
  @IsString() type: string;
  @IsOptional() @IsString() marque?: string;
  @IsOptional() @IsString() modele?: string;
  @IsOptional() @IsNumber() capaciteKg?: number;
  @IsOptional() @IsNumber() capaciteM3?: number;
  @IsOptional() @IsString() chauffeurId?: string;
  @IsOptional() @IsBoolean() disponible?: boolean;
}

export class CreateColisDto {
  @IsOptional() @IsString() expediteurId?: string;
  @IsString() destinataire: string;
  @IsOptional() @IsString() telephoneDest?: string;
  @IsString() adresseDest: string;
  @IsString() villeDest: string;
  @IsOptional() @IsNumber() poids?: number;
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() valeur?: number;
  @IsNumber() montant: number;
}

export class CreateTrajetDto {
  @IsOptional() @IsString() vehiculeId?: string;
  @IsOptional() @IsString() chauffeurId?: string;
  @IsString() villeDepart: string;
  @IsString() villeArrivee: string;
  @IsString() dateDepart: string;
  @IsOptional() @IsNumber() distance?: number;
  @IsOptional() @IsNumber() montant?: number;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  async findAllVehicules(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [{ immatriculation: { contains: pagination.search, mode: 'insensitive' } }, { marque: { contains: pagination.search, mode: 'insensitive' } }];
    }
    const [data, total] = await Promise.all([
      this.prisma.vehiculeTransport.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.vehiculeTransport.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createVehicule(tenantId: string, dto: CreateVehiculeDto) {
    return this.prisma.vehiculeTransport.create({ data: { ...dto, tenantId } });
  }

  async findAllColis(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [{ reference: { contains: pagination.search, mode: 'insensitive' } }, { destinataire: { contains: pagination.search, mode: 'insensitive' } }, { villeDest: { contains: pagination.search, mode: 'insensitive' } }];
    }
    const [data, total] = await Promise.all([
      this.prisma.colis.findMany({ where, skip, take: limit, include: { expediteur: true, trajet: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.colis.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createColis(tenantId: string, dto: CreateColisDto) {
    const ref = `COL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return this.prisma.colis.create({ data: { ...dto, tenantId, reference: ref }, include: { expediteur: true } });
  }

  async updateColisStatut(id: string, statut: string) {
    return this.prisma.colis.update({ where: { id }, data: { statut: statut as any }, include: { expediteur: true, trajet: true } });
  }

  async findAllTrajets(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.trajet.findMany({ where, skip, take: limit, include: { vehicule: true, colis: true }, orderBy: { dateDepart: 'desc' } }),
      this.prisma.trajet.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createTrajet(tenantId: string, dto: CreateTrajetDto) {
    return this.prisma.trajet.create({ data: { ...dto, tenantId, dateDepart: new Date(dto.dateDepart) }, include: { vehicule: true } });
  }

  async updateTrajetStatut(id: string, statut: string) {
    return this.prisma.trajet.update({ where: { id }, data: { statut: statut as any }, include: { vehicule: true, colis: true } });
  }

  async getStats(tenantId: string) {
    const vehicules = await this.prisma.vehiculeTransport.count({ where: { tenantId } });
    const disponibles = await this.prisma.vehiculeTransport.count({ where: { tenantId, disponible: true } });
    const colisEnCours = await this.prisma.colis.count({ where: { tenantId, statut: { in: ['ENREGISTRE', 'EN_TRANSIT'] } } });
    const colisLivre = await this.prisma.colis.count({ where: { tenantId, statut: 'LIVRE' } });
    const trajetsPlanifies = await this.prisma.trajet.count({ where: { tenantId, statut: { in: ['PLANIFIE', 'EN_COURS'] } } });
    return { vehicules, disponibles, colisEnCours, colisLivre, trajetsPlanifies };
  }
}
