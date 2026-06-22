import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { CreateVehiculeBtpDto, CreateLivraisonBtpDto, UpdateLivraisonStatutDto } from './dto/ciment-btp.dto';

export class PaginationDto {
  @IsOptional() @IsNumber() page?: number = 1;
  @IsOptional() @IsNumber() limit?: number = 20;
  @IsOptional() @IsString() search?: string;
}

@Injectable()
export class CimentBtpService {
  constructor(private prisma: PrismaService) {}

  // ── VÉHICULES ──────────────────────────────────
  async findAllVehicules(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search && typeof pagination.search === 'string' && pagination.search.trim() !== '') {
      where.immatriculation = { contains: pagination.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.vehiculeBTP.findMany({ where, skip, take: limit }),
      this.prisma.vehiculeBTP.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createVehicule(tenantId: string, data: CreateVehiculeBtpDto) {
    return this.prisma.vehiculeBTP.create({ data: { ...data, tenantId } });
  }

  async updateVehiculeDisponibilite(id: string, tenantId: string, disponible: boolean) {
    return this.prisma.vehiculeBTP.update({ where: { id, tenantId }, data: { disponible } });
  }

  // ── LIVRAISONS ─────────────────────────────────
  async findAllLivraisons(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.livraisonBTP.findMany({ where, skip, take: limit, include: { chantier: true, vehicule: true } }),
      this.prisma.livraisonBTP.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createLivraison(tenantId: string, data: CreateLivraisonBtpDto) {
    return this.prisma.livraisonBTP.create({ data: { ...data, tenantId } });
  }

  async updateLivraisonStatut(id: string, tenantId: string, data: UpdateLivraisonStatutDto) {
    return this.prisma.livraisonBTP.update({ where: { id, tenantId }, data: { statut: data.statut as any } });
  }

  async getLivraisonsByChantier(chantierId: string, tenantId: string) {
    return this.prisma.livraisonBTP.findMany({ where: { chantierId, tenantId }, include: { vehicule: true } });
  }

  async getStats(tenantId: string) {
    const [chantiers, livraisons] = await Promise.all([
      this.prisma.chantier.count({ where: { tenantId, statut: 'EN_COURS' } }),
      this.prisma.livraisonBTP.count({ where: { tenantId, datePlanifiee: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    ]);
    return { chantiersActifs: chantiers, livraisonsJour: livraisons, devisAttente: 0, stock: 0 };
  }
}
