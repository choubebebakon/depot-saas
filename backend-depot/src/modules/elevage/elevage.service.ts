import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  LotElevage,
  EvenementElevage,
  AlimentationElevage,
  Prisma,
  NotifType,
} from '@prisma/client';
import { NotificationsService } from '../../core/notifications/notifications.service';
import {
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
export enum ElevageStatut {
  ACTIF = 'ACTIF',
  VENDU = 'VENDU',
  TERMINE = 'TERMINE',
}

export enum EvenementElevageType {
  NAISSANCE = 'NAISSANCE',
  ACHAT = 'ACHAT',
  VENTE = 'VENTE',
  MORTALITE = 'MORTALITE',
  VACCINATION = 'VACCINATION',
  TRAITEMENT = 'TRAITEMENT',
  PESEE = 'PESEE',
}

export class CreateLotElevageDto {
  @IsString()
  nom: string;

  @IsString()
  espece: string;

  @IsOptional()
  @IsString()
  race?: string;

  @IsDateString()
  dateAcquisition: string;

  @IsInt()
  @Min(0)
  nombreInitial: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  nombreActuel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poidsUnitMoyen?: number;

  @IsOptional()
  @IsEnum(ElevageStatut)
  statut?: ElevageStatut;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLotElevageDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  espece?: string;

  @IsOptional()
  @IsString()
  race?: string;

  @IsOptional()
  @IsDateString()
  dateAcquisition?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nombreInitial?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  nombreActuel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poidsUnitMoyen?: number;

  @IsOptional()
  @IsEnum(ElevageStatut)
  statut?: ElevageStatut;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateEvenementElevageDto {
  @IsString()
  lotId: string;

  @IsEnum(EvenementElevageType)
  type: EvenementElevageType;

  @IsInt()
  @Min(0)
  quantite: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  poids?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montant?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class CreateAlimentationElevageDto {
  @IsString()
  lotId: string;

  @IsString()
  articleId: string;

  @IsNumber()
  @Min(0)
  quantiteKg: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

@Injectable()
export class ElevageService {
  private readonly logger = new Logger(ElevageService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifService: NotificationsService,
  ) {}

  // Lots d'élevage
  async createLot(
    tenantId: string,
    data: CreateLotElevageDto,
  ): Promise<LotElevage> {
    return this.prisma.lotElevage.create({
      data: { ...data, tenantId, nombreActuel: data.nombreInitial },
    });
  }

  async findAllLots(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<{
    data: LotElevage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search } = pagination;
    const where: Prisma.LotElevageWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { nom: { contains: search, mode: 'insensitive' } },
          { espece: { contains: search, mode: 'insensitive' } },
          { race: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lotElevage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lotElevage.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOneLot(tenantId: string, id: string): Promise<LotElevage | null> {
    return this.prisma.lotElevage.findUnique({
      where: { id, tenantId },
      include: {
        evenements: { orderBy: { date: 'desc' } },
        alimentations: {
          orderBy: { date: 'desc' },
          include: { article: true },
        },
      },
    });
  }

  async updateLot(
    tenantId: string,
    id: string,
    data: UpdateLotElevageDto,
  ): Promise<LotElevage> {
    const existingLot = await this.prisma.lotElevage.findUnique({
      where: { id, tenantId },
    });
    if (!existingLot) {
      throw new NotFoundException(
        `LotElevage with ID ${id} not found for tenant ${tenantId}`,
      );
    }
    return this.prisma.lotElevage.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteLot(tenantId: string, id: string): Promise<LotElevage> {
    const existingLot = await this.prisma.lotElevage.findUnique({
      where: { id, tenantId },
    });
    if (!existingLot) {
      throw new NotFoundException(
        `LotElevage with ID ${id} not found for tenant ${tenantId}`,
      );
    }
    return this.prisma.lotElevage.delete({ where: { id, tenantId } });
  }

  // Événements d'élevage
  async addEvenement(
    tenantId: string,
    lotId: string,
    data: CreateEvenementElevageDto,
  ): Promise<EvenementElevage> {
    const lot = await this.prisma.lotElevage.findUnique({
      where: { id: lotId, tenantId },
    });
    if (!lot) {
      throw new NotFoundException(
        `LotElevage with ID ${lotId} not found for tenant ${tenantId}`,
      );
    }

    const evenement = await this.prisma.evenementElevage.create({
      data: { ...data, tenantId, lotId },
    });

    // Mettre à jour le nombre actuel d'animaux dans le lot
    if (
      data.type === EvenementElevageType.NAISSANCE ||
      data.type === EvenementElevageType.ACHAT
    ) {
      await this.prisma.lotElevage.update({
        where: { id: lotId },
        data: { nombreActuel: { increment: data.quantite } },
      });
    } else if (
      data.type === EvenementElevageType.MORTALITE ||
      data.type === EvenementElevageType.VENTE
    ) {
      await this.prisma.lotElevage.update({
        where: { id: lotId },
        data: { nombreActuel: { decrement: data.quantite } },
      });
    }

    if (data.type === 'VACCINATION') {
      this.notifService
        .createFromTemplate(tenantId, NotifType.VACCINATION_PREVUE, {
          lotId,
          vaccinationType: data.type,
          datePrevue: data.date || new Date().toISOString(),
        })
        .catch((e) =>
          this.logger.error(`Erreur notif vaccination: ${e.message}`),
        );
    }

    return evenement;
  }

  async getEvenementsHistorique(
    tenantId: string,
    lotId: string,
    pagination: PaginationDto,
  ): Promise<{
    data: EvenementElevage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search } = pagination;
    const where: Prisma.EvenementElevageWhereInput = {
      tenantId,
      lotId,
      ...(search && {
        OR: [
          { type: { equals: search as EvenementElevageType } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.evenementElevage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.evenementElevage.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // Alimentation
  async recordAlimentation(
    tenantId: string,
    lotId: string,
    data: CreateAlimentationElevageDto,
  ): Promise<AlimentationElevage> {
    const lot = await this.prisma.lotElevage.findUnique({
      where: { id: lotId, tenantId },
    });
    if (!lot) {
      throw new NotFoundException(
        `LotElevage with ID ${lotId} not found for tenant ${tenantId}`,
      );
    }
    const article = await this.prisma.article.findUnique({
      where: { id: data.articleId, tenantId },
    });
    if (!article) {
      throw new NotFoundException(
        `Article with ID ${data.articleId} not found for tenant ${tenantId}`,
      );
    }
    // Diminuer le stock de l'aliment
    await this.prisma.stock.updateMany({
      where: { articleId: data.articleId, depot: { tenantId } },
      data: { quantite: { decrement: data.quantiteKg } }, // Supposons que quantiteKg correspond à une unité de stock
    });
    return this.prisma.alimentationElevage.create({
      data: { ...data, tenantId, lotId },
    });
  }

  // Statistiques
  async getElevageStats(tenantId: string): Promise<any> {
    const totalAnimaux = await this.prisma.lotElevage.aggregate({
      where: { tenantId, statut: ElevageStatut.ACTIF },
      _sum: { nombreActuel: true },
    });

    const mortaliteMois = await this.prisma.evenementElevage.count({
      where: {
        tenantId,
        type: EvenementElevageType.MORTALITE,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const ventesJour = await this.prisma.evenementElevage.aggregate({
      where: {
        tenantId,
        type: EvenementElevageType.VENTE,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { montant: true },
    });

    const stockAliment = await this.prisma.stock.aggregate({
      where: { article: { tenantId } },
      _sum: { quantite: true },
    });

    return {
      animaux_total: totalAnimaux._sum.nombreActuel || 0,
      mortalite_mois: mortaliteMois,
      ventes_jour: ventesJour._sum.montant || 0,
      stock_aliment: stockAliment._sum?.quantite || 0,
    };
  }
}
