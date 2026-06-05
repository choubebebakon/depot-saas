// ═════════════════════════════════════════════════════════════════
// QUINCAILLERIE — DTOs + Services
// Réutilise : Article, Client, Fournisseur, Vente, Livraison
// Ajoute : Devis, LigneDevis, Chantier
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/quincaillerie/dto/create-chantier.dto.ts
// ─────────────────────────────────────────────────────────────────
import {
  IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum ChantierStatut {
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
}

export class CreateChantierDto {
  @IsString()
  clientId: string;

  @IsString()
  nom: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetEstime?: number;
}

export class UpdateChantierDto {
  @IsEnum(ChantierStatut)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  statut?: ChantierStatut;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsNumber()
  @IsOptional()
  budgetEstime?: number;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/quincaillerie/dto/create-devis.dto.ts
// ─────────────────────────────────────────────────────────────────
import { Type } from 'class-transformer';
import {
  IsArray, ValidateNested, IsPositive,
} from 'class-validator';

export class LigneDevisDto {
  @IsString()
  articleId: string;

  @IsString()
  @IsOptional()
  designation?: string;   // Si vide → utilise le nom de l'article

  @IsNumber()
  @IsPositive()
  quantite: number;

  @IsString()
  @IsOptional()
  unite?: string;         // kg, m², litre, barre... défaut: PIECE

  @IsNumber()
  @IsPositive()
  prix: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  remise?: number = 0;
}

export class CreateDevisDto {
  @IsString()
  clientId: string;

  @IsString()
  @IsOptional()
  chantierId?: string;

  @IsDateString()
  dateExpiry: string;     // Validité du devis

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneDevisDto)
  lignes: LigneDevisDto[];
}

export class UpdateDevisStatutDto {
  @IsEnum(['EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI'])
  @Transform(({ value }) => value?.toUpperCase())
  statut: string;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/quincaillerie/services/chantier.service.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';

@Injectable()
export class ChantierService {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, dto: CreateChantierDto) {
    // Vérifie que le client existe
    await this.assertClientExists(tenantId, dto.clientId);

    return this.prisma.chantier.create({
      data: {
        ...dto,
        tenantId,
        dateDebut: new Date(dto.dateDebut),
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      },
      include: { client: { select: { nom: true, telephone: true } } },
    });
  }

  async findAll(tenantId: string, statut?: ChantierStatut) {
    return this.prisma.chantier.findMany({
      where: {
        tenantId,
        ...(statut ? { statut } : {}),
      },
      include: {
        client: { select: { nom: true, telephone: true } },
        devis: { select: { id: true, statut: true, montantTTC: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const chantier = await this.prisma.chantier.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        devis: {
          include: { lignes: true },
        },
      },
    });
    if (!chantier) throw new NotFoundException('Chantier introuvable');
    return chantier;
  }

  async updateStatut(tenantId: string, id: string, dto: UpdateChantierDto) {
    await this.assertExists(tenantId, id);
    return this.prisma.chantier.update({
      where: { id },
      data: {
        ...dto,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
      },
    });
  }

  private async assertExists(tenantId: string, id: string) {
    const c = await this.prisma.chantier.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Chantier introuvable');
    return c;
  }

  private async assertClientExists(tenantId: string, clientId: string) {
    const c = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!c) throw new NotFoundException('Client introuvable');
  }
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/quincaillerie/services/devis.service.ts
// ─────────────────────────────────────────────────────────────────
@Injectable()
export class DevisService {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, dto: CreateDevisDto) {
    // ── Calcul automatique des totaux ──────────────────────────
    const lignes = dto.lignes.map((l) => {
      const total = l.quantite * l.prix - (l.remise ?? 0);
      return { ...l, total };
    });

    const montantHT = lignes.reduce((sum, l) => sum + l.total, 0);
    const tva = 19.25;
    const montantTTC = montantHT * (1 + tva / 100);

    // ── Génération de la référence ──────────────────────────────
    const count = await this.prisma.devis.count({ where: { tenantId } });
    const reference = `DEV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.devis.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        chantierId: dto.chantierId,
        reference,
        montantHT,
        tva,
        montantTTC,
        dateExpiry: new Date(dto.dateExpiry),
        notes: dto.notes,
        lignes: {
          create: lignes.map((l) => ({
            articleId: l.articleId,
            designation: l.designation,
            quantite: l.quantite,
            unite: l.unite ?? 'PIECE',
            prix: l.prix,
            remise: l.remise ?? 0,
            total: l.total,
          })),
        },
      },
      include: {
        client: { select: { nom: true, telephone: true } },
        lignes: { include: { article: { select: { designation: true } } } },
        chantier: true,
      },
    });
  }

  async findAll(tenantId: string, statut?: string) {
    return this.prisma.devis.findMany({
      where: {
        tenantId,
        ...(statut ? { statut } : {}),
      },
      include: {
        client: { select: { nom: true } },
        chantier: { select: { nom: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const devis = await this.prisma.devis.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        chantier: true,
        lignes: { include: { article: { select: { designation: true, prixVente: true } } } },
      },
    });
    if (!devis) throw new NotFoundException('Devis introuvable');
    return devis;
  }

  // ── Convertir devis en facture ──────────────────────────────
  async convertirEnFacture(tenantId: string, id: string) {
    const devis = await this.findOne(tenantId, id);

    if (devis.statut !== 'ACCEPTE') {
      throw new BadRequestException('Seuls les devis acceptés peuvent être convertis');
    }

    // Marque le devis comme converti
    await this.prisma.devis.update({
      where: { id },
      data: { statut: 'CONVERTI' },
    });

    return { message: 'Devis converti — créer la facture avec les données ci-dessous', devis };
  }

  // ── Mettre à jour le statut ─────────────────────────────────
  async updateStatut(tenantId: string, id: string, dto: UpdateDevisStatutDto) {
    await this.findOne(tenantId, id);
    return this.prisma.devis.update({
      where: { id },
      data: { statut: dto.statut as any },
    });
  }

  // ── Vérification des devis expirés (à appeler en cron) ──────
  async marquerExpires() {
    return this.prisma.devis.updateMany({
      where: {
        statut: 'EN_ATTENTE',
        dateExpiry: { lt: new Date() },
      },
      data: { statut: 'EXPIRE' },
    });
  }
}