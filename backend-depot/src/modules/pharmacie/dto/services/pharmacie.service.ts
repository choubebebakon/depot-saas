// ═════════════════════════════════════════════════════════════════
// PHARMACIE — DTOs + Services
// Réutilise : Article (= Medicament), Client, Fournisseur, LotStock
//             (LotStock a déjà dlc + numeroLot ✅)
// Ajoute : MedicamentDetail, Ordonnance, AlerteDLC
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/pharmacie/dto/create-medicament.dto.ts
// ─────────────────────────────────────────────────────────────────
import {
  IsString, IsBoolean, IsOptional, IsDateString,
} from 'class-validator';

export class CreateMedicamentDetailDto {
  @IsString()
  articleId: string;        // Référence vers Article existant

  @IsString()
  numeroLot: string;

  @IsDateString()
  dateExpiration: string;

  @IsString()
  @IsOptional()
  dosage?: string;          // Ex: 500mg, 1g

  @IsString()
  @IsOptional()
  formeGalenique?: string;  // Comprimé, sirop, injectable

  @IsString()
  famille: string;          // Antibiotique, Antalgique, Antifongique...

  @IsBoolean()
  @IsOptional()
  surOrdonnance?: boolean = false;
}

export class UpdateMedicamentDetailDto {
  @IsBoolean()
  @IsOptional()
  surOrdonnance?: boolean;

  @IsString()
  @IsOptional()
  famille?: string;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/pharmacie/dto/create-ordonnance.dto.ts
// ─────────────────────────────────────────────────────────────────
import { Type } from 'class-transformer';
import {
  IsArray, ValidateNested, IsPositive, IsNumber,
} from 'class-validator';

export class LigneOrdonnanceDto {
  @IsString()
  articleId: string;        // Médicament (Article)

  @IsNumber()
  @IsPositive()
  quantitePrescrite: number;

  @IsString()
  @IsOptional()
  posologie?: string;       // Ex: 1 comprimé 3x/jour

  @IsString()
  @IsOptional()
  duree?: string;           // Ex: 7 jours
}

export class CreateOrdonnanceDto {
  @IsString()
  clientId: string;

  @IsString()
  @IsOptional()
  medecin?: string;

  @IsString()
  @IsOptional()
  etablissement?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsDateString()
  dateEmise: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneOrdonnanceDto)
  lignes: LigneOrdonnanceDto[];
}

export class DelivrerOrdonnanceDto {
  @IsString()
  ligneOrdonnanceId: string;

  @IsNumber()
  @IsPositive()
  quantiteDelivree: number;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/pharmacie/services/medicament.service.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';

@Injectable()
export class MedicamentService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Ajouter les détails pharma à un article existant ────────
  async createDetail(tenantId: string, dto: CreateMedicamentDetailDto) {
    // Vérifie que l'article existe
    const article = await this.prisma.article.findFirst({
      where: { id: dto.articleId, tenantId },
    });
    if (!article) throw new NotFoundException('Article introuvable');

    // Vérifie pas de doublon
    const existing = await this.prisma.medicament.findUnique({
      where: { articleId: dto.articleId },
    });
    if (existing) throw new ConflictException('Détails médicament déjà configurés pour cet article');

    const { formeGalenique, ...rest } = dto;
    return this.prisma.medicament.create({
      data: {
        ...rest,
        tenantId,
        dateExpiration: new Date(dto.dateExpiration),
      },
      include: { article: { select: { designation: true, prixVente: true } } },
    });
  }

  // ── Liste des médicaments (Article + MedicamentDetail) ───────
  async findAll(tenantId: string) {
    return this.prisma.medicament.findMany({
      where: { tenantId },
      include: {
        article: {
          select: {
            id: true,
            designation: true,
            prixVente: true,
            prixAchat: true,
            stocks: { select: { quantite: true, depot: { select: { nom: true } } } },
          },
        },
      },
      orderBy: { dateExpiration: 'asc' },
    });
  }

  // ── Médicaments sur ordonnance uniquement ────────────────────
  async findSurOrdonnance(tenantId: string) {
    return this.prisma.medicament.findMany({
      where: { tenantId, surOrdonnance: true },
      include: { article: { select: { designation: true } } },
    });
  }

  // ── Alertes DLC : expire dans N jours ────────────────────────
  async getAlertesDLC(tenantId: string, joursAvant: 30 | 60 | 90 = 30) {
    const limite = new Date();
    limite.setDate(limite.getDate() + joursAvant);

    const medicaments = await this.prisma.medicament.findMany({
      where: {
        tenantId,
        dateExpiration: {
          gte: new Date(),  // Pas encore expirés
          lte: limite,      // Expire dans N jours
        },
      },
      include: {
        article: {
          select: {
            designation: true,
            stocks: { select: { quantite: true } },
          },
        },
      },
      orderBy: { dateExpiration: 'asc' },
    });

    // Enrichit avec le niveau d'urgence
    return medicaments.map((m) => {
      const joursRestants = Math.ceil(
        (new Date(m.dateExpiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...m,
        joursRestants,
        urgence: joursRestants <= 7 ? 'CRITIQUE' : joursRestants <= 30 ? 'HAUTE' : 'NORMALE',
      };
    });
  }

  // ── Médicaments expirés ──────────────────────────────────────
  async getExpires(tenantId: string) {
    return this.prisma.medicament.findMany({
      where: {
        tenantId,
        dateExpiration: { lt: new Date() },
      },
      include: { article: { select: { designation: true } } },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/pharmacie/services/ordonnance.service.ts
// ─────────────────────────────────────────────────────────────────
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class OrdonnanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Créer une ordonnance ─────────────────────────────────────
  async create(tenantId: string, dto: CreateOrdonnanceDto) {
    const linesToCreate = [];
    for (const ligne of dto.lignes) {
      const article = await this.prisma.article.findFirst({
        where: { id: ligne.articleId, tenantId },
      });
      if (!article) {
        throw new NotFoundException(`Médicament ${ligne.articleId} introuvable`);
      }
      const med = await this.prisma.medicament.findUnique({
        where: { articleId: ligne.articleId },
      });
      if (!med) {
        throw new NotFoundException(`Détails médicament pour l'article ${ligne.articleId} introuvable`);
      }
      linesToCreate.push({
        medicamentId: med.id,
        quantite: ligne.quantitePrescrite,
        posologie: ligne.posologie,
      });
    }

    return this.prisma.ordonnance.create({
      data: {
        tenantId,
        clientId:      dto.clientId,
        medecin:       dto.medecin,
        photoUrl:      dto.photoUrl,
        dateEmise:     new Date(dto.dateEmise),
        lignes: {
          create: linesToCreate,
        },
      },
      include: {
        client: { select: { nom: true, telephone: true } },
        lignes: {
          include: { medicament: { include: { article: { select: { designation: true } } } } },
        },
      },
    });
  }

  async findAll(tenantId: string, statut?: string) {
    return this.prisma.ordonnance.findMany({
      where: {
        tenantId,
        ...(statut ? { statut } : {}),
      },
      include: {
        client: { select: { nom: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const ord = await this.prisma.ordonnance.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        lignes: { include: { medicament: { include: { article: { select: { designation: true } } } } } },
      },
    });
    if (!ord) throw new NotFoundException('Ordonnance introuvable');
    return ord;
  }

  // ── Délivrer (partiellement ou totalement) ───────────────────
  async delivrer(tenantId: string, ordonnanceId: string, dto: DelivrerOrdonnanceDto) {
    const ordonnance = await this.findOne(tenantId, ordonnanceId);
    const ligne = ordonnance.lignes.find((l: any) => l.id === dto.ligneOrdonnanceId);

    if (!ligne) throw new NotFoundException('Ligne ordonnance introuvable');

    const nouveauTotal = (ligne.quantite || 0) + dto.quantiteDelivree;
    if (nouveauTotal > (ligne.quantite || 0)) {
      throw new BadRequestException(
        `Quantité délivrée dépasse la quantité prescrite`
      );
    }

    await this.prisma.ordonnance.update({
      where: { id: ordonnanceId },
      data: { statut: 'COMPLETE' },
    });

    return this.findOne(tenantId, ordonnanceId);
  }
}