import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { NotifType } from '@prisma/client';
import {
  IsString,
  IsInt,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateTypeChambreDto {
  @IsString() nom: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() capacite?: number;
  @IsNumber() prixNuit: number;
  @IsOptional() @IsString() equipements?: string;
}

export class CreateChambreDto {
  @IsString() numero: string;
  @IsOptional() @IsInt() etage?: number;
  @IsString() typeChambreId: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateReservationDto {
  @IsOptional() @IsString() clientId?: string;
  @IsString() chambreId: string;
  @IsString() nomClient: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() email?: string;
  @IsString() dateArrivee: string;
  @IsString() dateDepart: string;
  @IsInt() @Min(1) nbPersonnes: number;
  @IsNumber() prixTotal: number;
  @IsOptional() @IsNumber() avance?: number;
  @IsOptional() @IsString() modePaiement?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateConsommationDto {
  @IsOptional() @IsString() articleId?: string;
  @IsString() designation: string;
  @IsInt() quantite: number;
  @IsNumber() prix: number;
}

@Injectable()
export class HotellerieService {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) {}

  async findAllTypes(tenantId: string) {
    return this.prisma.typeChambre.findMany({
      where: { tenantId },
      orderBy: { prixNuit: 'asc' },
    });
  }

  async createType(tenantId: string, dto: CreateTypeChambreDto) {
    return this.prisma.typeChambre.create({ data: { ...dto, tenantId } });
  }

  async findAllChambres(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 30;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.numero = { contains: pagination.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.chambre.findMany({
        where,
        skip,
        take: limit,
        include: {
          typeChambre: true,
          reservations: {
            where: { statut: { in: ['CONFIRMEE', 'CHECKIN'] } },
            take: 1,
          },
        },
        orderBy: { numero: 'asc' },
      }),
      this.prisma.chambre.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createChambre(tenantId: string, dto: CreateChambreDto) {
    return this.prisma.chambre.create({
      data: { ...dto, tenantId },
      include: { typeChambre: true },
    });
  }

  async updateChambreStatut(id: string, statut: string) {
    return this.prisma.chambre.update({
      where: { id },
      data: { statut: statut as any },
      include: { typeChambre: true },
    });
  }

  async findAllReservations(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.OR = [
        { nomClient: { contains: pagination.search, mode: 'insensitive' } },
        { reference: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.reservationHotel.findMany({
        where,
        skip,
        take: limit,
        include: {
          chambre: { include: { typeChambre: true } },
          client: true,
          consommations: true,
        },
        orderBy: { dateArrivee: 'desc' },
      }),
      this.prisma.reservationHotel.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createReservation(tenantId: string, dto: CreateReservationDto) {
    const chambre = await this.prisma.chambre.findUnique({
      where: { id: dto.chambreId },
    });
    if (!chambre || chambre.tenantId !== tenantId)
      throw new NotFoundException('Chambre introuvable');

    const arrivee = new Date(dto.dateArrivee);
    const depart = new Date(dto.dateDepart);
    const nbNuits = Math.max(
      1,
      Math.round(
        (depart.getTime() - arrivee.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const ref = `HOTEL-${Date.now().toString(36).toUpperCase()}`;

    const reservation = await this.prisma.reservationHotel.create({
      data: {
        ...dto,
        tenantId,
        reference: ref,
        dateArrivee: arrivee,
        dateDepart: depart,
        nbNuits,
        modePaiement: (dto.modePaiement as any) || 'CASH',
      },
      include: { chambre: { include: { typeChambre: true } }, client: true },
    });

    this.notifService
      .createFromTemplate(tenantId, NotifType.RESERVATION_NOUVELLE, {
        numeroChambre: reservation.chambre?.numero || 'N/A',
        nomClient: dto.nomClient,
        dateArrivee: dto.dateArrivee,
      })
      .catch(() => {});

    return reservation;
  }

  async updateReservationStatut(id: string, statut: string) {
    const reservation = await this.prisma.reservationHotel.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const updated = await this.prisma.reservationHotel.update({
      where: { id },
      data: { statut: statut as any },
      include: { chambre: true, client: true },
    });

    const notifMap: Record<string, { type: NotifType; label: string }> = {
      CHECKIN: { type: NotifType.CHECKIN_HOTEL, label: 'Check-in' },
      CHECKOUT: { type: NotifType.CHECKOUT_HOTEL, label: 'Check-out' },
      ANNULEE: { type: NotifType.RESERVATION_ANNULEE, label: 'Annulation' },
    };

    const mapping = notifMap[statut];
    if (mapping) {
      const chambreNum = updated.chambre?.numero || 'N/A';
      const clientNom = updated.client?.nom || updated.nomClient || 'Client';

      if (mapping.type === NotifType.CHECKOUT_HOTEL) {
        this.notifService
          .createFromTemplate(reservation.tenantId, mapping.type, {
            chambre: chambreNum,
            client: clientNom,
          })
          .catch(() => {});
        this.notifService
          .createFromTemplate(reservation.tenantId, NotifType.CHAMBRE_MENAGE, {
            chambre: chambreNum,
          })
          .catch(() => {});
      } else {
        this.notifService
          .createFromTemplate(reservation.tenantId, mapping.type, {
            chambre: chambreNum,
            client: clientNom,
          })
          .catch(() => {});
      }
    }

    return updated;
  }

  async addConsommation(reservationId: string, dto: CreateConsommationDto) {
    const total = dto.quantite * dto.prix;
    return this.prisma.consommationHotel.create({
      data: { ...dto, reservationId, total },
      include: { article: true },
    });
  }

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalChambres = await this.prisma.chambre.count({
      where: { tenantId },
    });
    const occupees = await this.prisma.chambre.count({
      where: { tenantId, statut: 'OCCUPEE' },
    });
    const libres = await this.prisma.chambre.count({
      where: { tenantId, statut: 'LIBRE' },
    });
    const arriveesAujourdhui = await this.prisma.reservationHotel.count({
      where: { tenantId, dateArrivee: { gte: today, lt: tomorrow } },
    });
    const departsAujourdhui = await this.prisma.reservationHotel.count({
      where: { tenantId, dateDepart: { gte: today, lt: tomorrow } },
    });
    const actives = await this.prisma.reservationHotel.count({
      where: { tenantId, statut: { in: ['CONFIRMEE', 'CHECKIN'] } },
    });

    return {
      totalChambres,
      occupees,
      libres,
      tauxOccupation:
        totalChambres > 0 ? Math.round((occupees / totalChambres) * 100) : 0,
      arriveesAujourdhui,
      departsAujourdhui,
      actives,
    };
  }
}
