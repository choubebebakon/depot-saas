import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotifType } from '@prisma/client';
import { CreateVehiculeClientDto, CreateFicheTravailDto, UpdateFicheStatutDto } from './dto/garage.dto';
import { PaginationDto } from '../supermarche/supermarche.service';
import { NotificationsService } from '../../core/notifications/notifications.service';

@Injectable()
export class GarageService {
  private readonly logger = new Logger(GarageService.name);
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) { }

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
      this.prisma.vehiculeClient.findMany({ where, skip, take: limit, include: { client: true } }),
      this.prisma.vehiculeClient.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createVehicule(tenantId: string, data: CreateVehiculeClientDto) {
    return this.prisma.vehiculeClient.create({ data: { ...data, tenantId } });
  }

  async deleteVehicule(id: string, tenantId: string) {
    return this.prisma.vehiculeClient.delete({ where: { id, tenantId } });
  }

  async getVehiculesByClient(clientId: string, tenantId: string) {
    return this.prisma.vehiculeClient.findMany({ where: { clientId, tenantId } });
  }

  // ── FICHES TRAVAUX ────────────────────────────
  async findAllFiches(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.ficheTravailGarage.findMany({ where, skip, take: limit, include: { vehicule: true } }),
      this.prisma.ficheTravailGarage.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async deleteFiche(id: string, tenantId: string) {
    return this.prisma.ficheTravailGarage.delete({ where: { id, tenantId } });
  }

  async createFiche(tenantId: string, data: CreateFicheTravailDto) {
    return this.prisma.ficheTravailGarage.create({
      data: {
        vehiculeId: data.vehiculeId,
        problemeClient: data.problemeClient,
        travaux: data.travaux,
        tenantId,
        reference: 'FT-' + Date.now(),
        pieces: {
          create: (data.pieces || []).map(p => ({
            designation: p.designation,
            quantite: p.quantite,
            prix: p.prix,
            total: p.quantite * p.prix
          }))
        },
      },
    });
  }


  async updateFicheStatut(id: string, tenantId: string, data: UpdateFicheStatutDto) {
    const updated = await this.prisma.ficheTravailGarage.update({
      where: { id, tenantId },
      data: { statut: data.statut as any },
      include: { vehicule: { include: { client: true } } },
    });

    if (data.statut === 'TERMINEE' || data.statut === 'LIVRE') {
      this.notifService.createFromTemplate(
        tenantId,
        NotifType.REPARATION_PRETE,
        {
          vehicule: updated.vehicule?.immatriculation || 'N/A',
          client: updated.vehicule?.client?.nom || 'Client',
        },
      ).catch((e) => this.logger.error(`Erreur notif garage: ${e.message}`));
    }

    return updated;
  }

  async getStats(tenantId: string) {
    const [enCours, recettes] = await Promise.all([
      this.prisma.ficheTravailGarage.count({ where: { tenantId, statut: { notIn: ['LIVRE', 'ANNULE'] } } }),
      this.prisma.ficheTravailGarage.aggregate({ where: { tenantId, dateEntree: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { montantTotal: true } }),
    ]);
    return { repairsEnCours: enCours, pretsLivraison: 0, recettesJour: recettes._sum.montantTotal || 0, pieces: 0 };
  }
}
