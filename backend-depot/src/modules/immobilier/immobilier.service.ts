import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsInt, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateBienDto {
  @IsString() reference: string;
  @IsString() type: string;
  @IsString() adresse: string;
  @IsString() ville: string;
  @IsOptional() @IsNumber() surface?: number;
  @IsOptional() @IsInt() nbPieces?: number;
  @IsOptional() @IsInt() etage?: number;
  @IsNumber() loyer: number;
  @IsOptional() @IsNumber() charges?: number;
  @IsOptional() @IsNumber() depot?: number;
  @IsOptional() @IsBoolean() disponible?: boolean;
  @IsOptional() @IsString() description?: string;
}

export class CreateContratDto {
  @IsString() bienId: string;
  @IsString() locataireId: string;
  @IsString() dateDebut: string;
  @IsOptional() dateFin?: string;
  @IsNumber() loyer: number;
  @IsOptional() @IsNumber() charges?: number;
  @IsOptional() @IsNumber() depot?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePaiementDto {
  @IsString() contratId: string;
  @IsString() mois: string;
  @IsNumber() montant: number;
  @IsOptional() @IsNumber() charges?: number;
  @IsOptional() @IsString() modePaiement?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateInterventionDto {
  @IsString() bienId: string;
  @IsString() type: string;
  @IsString() description: string;
  @IsOptional() @IsNumber() cout?: number;
  @IsOptional() @IsString() statut?: string;
}

@Injectable()
export class ImmobilierService {
  constructor(private prisma: PrismaService) {}

  async findAllBiens(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [{ reference: { contains: pagination.search, mode: 'insensitive' } }, { ville: { contains: pagination.search, mode: 'insensitive' } }, { adresse: { contains: pagination.search, mode: 'insensitive' } }];
    }
    const [data, total] = await Promise.all([
      this.prisma.bienImmobilier.findMany({ where, skip, take: limit, include: { contrats: { where: { statut: 'ACTIF' }, include: { locataire: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.bienImmobilier.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createBien(tenantId: string, dto: CreateBienDto) {
    return this.prisma.bienImmobilier.create({ data: { ...dto, tenantId, type: dto.type as any } });
  }

  async findAllContrats(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.contratLocation.findMany({ where, skip, take: limit, include: { bien: true, locataire: true, paiements: { orderBy: { dateEcheance: 'desc' }, take: 3 } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.contratLocation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createContrat(tenantId: string, dto: CreateContratDto) {
    return this.prisma.contratLocation.create({
      data: { ...dto, tenantId, dateDebut: new Date(dto.dateDebut), dateFin: dto.dateFin ? new Date(dto.dateFin) : null },
      include: { bien: true, locataire: true },
    });
  }

  async updateContratStatut(id: string, statut: string) {
    return this.prisma.contratLocation.update({ where: { id }, data: { statut: statut as any }, include: { bien: true, locataire: true } });
  }

  async findAllPaiements(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 30;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.paiementLoyer.findMany({ where, skip, take: limit, include: { contrat: { include: { bien: true, locataire: true } } }, orderBy: { dateEcheance: 'desc' } }),
      this.prisma.paiementLoyer.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createPaiement(tenantId: string, dto: CreatePaiementDto) {
    return this.prisma.paiementLoyer.create({
      data: { ...dto, tenantId, charges: dto.charges || 0, dateEcheance: new Date(new Date().getFullYear(), new Date().getMonth(), 5), modePaiement: (dto.modePaiement as any) || 'CASH' },
      include: { contrat: { include: { bien: true, locataire: true } } },
    });
  }

  async findAllInterventions(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.interventionBien.findMany({ where, skip, take: limit, include: { bien: true }, orderBy: { date: 'desc' } }),
      this.prisma.interventionBien.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createIntervention(tenantId: string, dto: CreateInterventionDto) {
    return this.prisma.interventionBien.create({ data: { ...dto, tenantId }, include: { bien: true } });
  }

  async getStats(tenantId: string) {
    const totalBiens = await this.prisma.bienImmobilier.count({ where: { tenantId } });
    const disponibles = await this.prisma.bienImmobilier.count({ where: { tenantId, disponible: true } });
    const contratsActifs = await this.prisma.contratLocation.count({ where: { tenantId, statut: 'ACTIF' } });
    const loyersMensuels = await this.prisma.contratLocation.aggregate({ where: { tenantId, statut: 'ACTIF' }, _sum: { loyer: true } });
    const enRetard = await this.prisma.paiementLoyer.count({ where: { tenantId, statut: 'EN_RETARD' } });
    return { totalBiens, disponibles, loues: totalBiens - disponibles, contratsActifs, loyersMensuels: loyersMensuels._sum.loyer || 0, enRetard };
  }
}
