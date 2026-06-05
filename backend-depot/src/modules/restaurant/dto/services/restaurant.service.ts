// ═════════════════════════════════════════════════════════════════
// RESTAURANT — DTOs + Services
// Réutilise : Client, SessionCaisse, Depense
// Ajoute : table, Plat, Commande, Reservation
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/restaurant/dto/create-plat.dto.ts
// ─────────────────────────────────────────────────────────────────
import {
  IsString, IsNumber, IsBoolean, IsOptional,
  IsPositive, IsEnum,
} from 'class-validator';

export class CreatePlatDto {
  @IsString()
  nom: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  prix: number;

  @IsString()
  categorie: string;  // Entrée, Plat, Dessert, Boisson...

  @IsBoolean()
  @IsOptional()
  disponible?: boolean = true;

  @IsNumber()
  @IsOptional()
  tempsPrep?: number;  // Minutes

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdatePlatDto {
  @IsBoolean()
  @IsOptional()
  disponible?: boolean;

  @IsNumber()
  @IsOptional()
  prix?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/restaurant/dto/create-commande.dto.ts
// ─────────────────────────────────────────────────────────────────
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export enum CommandeType {
  SUR_PLACE = 'SUR_PLACE',
  A_EMPORTER = 'A_EMPORTER',
  LIVRAISON = 'LIVRAISON',
}

export class LigneCommandeDto {
  @IsString()
  platId: string;

  @IsNumber()
  @IsPositive()
  quantite: number;

  @IsString()
  @IsOptional()
  notes?: string;  // "sans sel", "bien cuit"...
}

export class CreateCommandeDto {
  @IsString()
  @IsOptional()
  tableId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEnum(CommandeType)
  @IsOptional()
  type?: CommandeType = CommandeType.SUR_PLACE;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeDto)
  lignes: LigneCommandeDto[];
}

export class UpdateCommandeStatutDto {
  @IsEnum(['EN_ATTENTE', 'EN_PREPARATION', 'PRET', 'SERVI', 'ANNULE', 'PAYE'])
  statut: string;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/restaurant/dto/create-reservation.dto.ts
// ─────────────────────────────────────────────────────────────────
import { IsDateString, IsInt } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  tableId?: string;

  @IsString()
  nomClient: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsDateString()
  dateArrivee: string;

  @IsInt()
  nbPersonnes: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/restaurant/services/tables.service.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, data: { numero: number; capacite: number; nom?: string; etage?: string }) {
    // Vérifie que le numéro n'existe pas déjà
    const existing = await this.prisma.table.findUnique({
      where: { tenantId_numero: { tenantId, numero: data.numero } },
    });
    if (existing) throw new ConflictException(`Table numéro ${data.numero} existe déjà`);

    return this.prisma.table.create({ data: { ...data, tenantId } });
  }

  // ── Plan de salle complet ─────────────────────────────────────
  async getPlanSalle(tenantId: string) {
    return this.prisma.table.findMany({
      where: { tenantId },
      include: {
        commandes: {
          where: { statut: { notIn: ['ANNULE', 'PAYE'] } },
          select: { id: true, statut: true, total: true, createdAt: true },
        },
        reservations: {
          where: {
            statut: 'CONFIRMEE',
            dateArrivee: { gte: new Date() },
          },
          select: { nomClient: true, dateArrivee: true, nbPersonnes: true },
          take: 1,
          orderBy: { dateArrivee: 'asc' },
        },
      },
      orderBy: { numero: 'asc' },
    });
  }

  // ── Changer le statut d'une table ─────────────────────────────
  async updateStatut(tenantId: string, id: string, statut: string) {
    await this.assertExists(tenantId, id);
    return this.prisma.table.update({
      where: { id },
      data: { statut: statut as any },
    });
  }

  private async assertExists(tenantId: string, id: string) {
    const t = await this.prisma.table.findFirst({ where: { id, tenantId } });
    if (!t) throw new NotFoundException('Table introuvable');
    return t;
  }
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/restaurant/services/commandes.service.ts
// ─────────────────────────────────────────────────────────────────
@Injectable()
export class CommandesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, dto: CreateCommandeDto, serveurId: string) {
    // ── Récupère les prix des plats ───────────────────────────
    const platIds = dto.lignes.map((l) => l.platId);
    const plats = await this.prisma.plat.findMany({
      where: { id: { in: platIds }, tenantId },
    });

    // Vérifie disponibilité de tous les plats
    const platIndispo = plats.find((p) => !p.disponible);
    if (platIndispo) {
      throw new BadRequestException(`Plat "${platIndispo.nom}" non disponible`);
    }

    if (plats.length !== platIds.length) {
      throw new NotFoundException('Un ou plusieurs plats introuvables');
    }

    // ── Calcul du total ───────────────────────────────────────
    const platMap = new Map<string, typeof plats[0]>(plats.map((p) => [p.id, p]));
    const lignes = dto.lignes.map((l) => ({
      ...l,
      prix: platMap.get(l.platId)!.prix,
    }));
    const total = lignes.reduce((sum, l) => sum + l.prix * l.quantite, 0);

    // ── Création de la commande ───────────────────────────────
    const commande = await this.prisma.commande.create({
      data: {
        tenantId,
        tableId: dto.tableId,
        clientId: dto.clientId,
        serveurId,
        type: dto.type ?? 'SUR_PLACE',
        notes: dto.notes,
        total,
        lignes: {
          create: lignes.map((l) => ({
            platId: l.platId,
            quantite: l.quantite,
            prix: l.prix,
            notes: l.notes,
          })),
        },
      },
      include: {
        table: { select: { numero: true, nom: true } },
        lignes: { include: { plat: { select: { nom: true, categorie: true } } } },
      },
    });

    // ── Met à jour le statut de la table → OCCUPEE ────────────
    if (dto.tableId) {
      await this.prisma.table.update({
        where: { id: dto.tableId },
        data: { statut: 'OCCUPEE' },
      });
    }

    return commande;
  }

  // ── Commandes pour la cuisine (ticket cuisine) ────────────────
  async getTicketCuisine(tenantId: string) {
    return this.prisma.commande.findMany({
      where: {
        tenantId,
        statut: { in: ['EN_ATTENTE', 'EN_PREPARATION'] },
      },
      include: {
        table: { select: { numero: true } },
        lignes: {
          where: { statut: { not: 'ANNULE' } },
          include: { plat: { select: { nom: true, tempsPrep: true, categorie: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Mettre à jour le statut d'une commande ────────────────────
  async updateStatut(tenantId: string, id: string, dto: UpdateCommandeStatutDto) {
    const commande = await this.prisma.commande.findFirst({ where: { id, tenantId } });
    if (!commande) throw new NotFoundException('Commande introuvable');

    const updated = await this.prisma.commande.update({
      where: { id },
      data: { statut: dto.statut as any },
    });

    // Si payé → libérer la table
    if (dto.statut === 'PAYE' && commande.tableId) {
      await this.prisma.table.update({
        where: { id: commande.tableId },
        data: { statut: 'LIBRE' },
      });
    }

    return updated;
  }

  // ── Stats du jour ─────────────────────────────────────────────
  async statsJour(tenantId: string) {
    const debut = new Date(); debut.setHours(0, 0, 0, 0);
    const fin = new Date(); fin.setHours(23, 59, 59, 999);

    const [total, commandesJour, tablesOccupees] = await Promise.all([
      this.prisma.commande.aggregate({
        where: { tenantId, statut: 'PAYE', createdAt: { gte: debut, lte: fin } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.commande.count({
        where: { tenantId, createdAt: { gte: debut, lte: fin } },
      }),
      this.prisma.table.count({
        where: { tenantId, statut: 'OCCUPEE' },
      }),
    ]);

    return {
      recettesJour: total._sum.total ?? 0,
      commandesPayees: total._count,
      commandesTotal: commandesJour,
      tablesOccupees,
    };
  }
}