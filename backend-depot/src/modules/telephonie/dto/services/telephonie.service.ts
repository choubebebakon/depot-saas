// ═════════════════════════════════════════════════════════════════
// TÉLÉPHONIE — DTOs + Services
// Réutilise : Article, Client, Vente, SessionCaisse
// Ajoute : Telephone (IMEI), Reparation, PieceReparation
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/telephonie/dto/create-telephone.dto.ts
// ─────────────────────────────────────────────────────────────────
import {
  IsString, IsBoolean, IsOptional, IsNumber,
  IsPositive, IsEnum, IsDateString, Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum TelephoneEtat {
  NEUF = 'NEUF',
  RECONDITIONNE = 'RECONDITIONNE',
  OCCASION = 'OCCASION',
}

export class CreateTelephoneDto {
  @IsString()
  articleId: string;      // Référence Article existant

  @IsString()
  imei: string;           // IMEI principal — unique mondial

  @IsString()
  @IsOptional()
  imei2?: string;         // Second IMEI (dual-SIM)

  @IsString()
  marque: string;

  @IsString()
  modele: string;

  @IsString()
  @IsOptional()
  couleur?: string;

  @IsString()
  @IsOptional()
  stockage?: string;      // 128Go, 256Go...

  @IsString()
  @IsOptional()
  ram?: string;           // 8Go, 12Go...

  @IsEnum(TelephoneEtat)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  etat?: TelephoneEtat = TelephoneEtat.NEUF;

  @IsNumber()
  @IsOptional()
  garantieMois?: number = 12;

  @IsDateString()
  @IsOptional()
  dateAchat?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  prixAchat?: number;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/telephonie/dto/create-reparation.dto.ts
// ─────────────────────────────────────────────────────────────────
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export enum ReparationStatut {
  RECU = 'RECU',
  EN_DIAGNOSTIC = 'EN_DIAGNOSTIC',
  EN_ATTENTE_PIECES = 'EN_ATTENTE_PIECES',
  EN_REPARATION = 'EN_REPARATION',
  PRET = 'PRET',
  LIVRE = 'LIVRE',
  ANNULE = 'ANNULE',
  IRREPARABLE = 'IRREPARABLE',
}

export class PieceReparationDto {
  @IsString()
  @IsOptional()
  articleId?: string;     // Si pièce en stock GeStock

  @IsString()
  nom: string;

  @IsNumber()
  @IsPositive()
  quantite: number;

  @IsNumber()
  @IsPositive()
  prix: number;
}

export class CreateReparationDto {
  @IsString()
  clientId: string;

  @IsString()
  @IsOptional()
  telephoneId?: string;   // Si téléphone en stock GeStock

  @IsString()
  @IsOptional()
  imei?: string;          // Si apporté par le client

  @IsString()
  @IsOptional()
  marque?: string;

  @IsString()
  @IsOptional()
  modele?: string;

  @IsString()
  probleme: string;       // Description du problème client

  @IsString()
  @IsOptional()
  diagnostic?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  montantDevis?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  avance?: number = 0;

  @IsString()
  @IsOptional()
  technicienId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PieceReparationDto)
  pieces?: PieceReparationDto[] = [];
}

export class UpdateReparationDto {
  @IsEnum(ReparationStatut)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  statut?: ReparationStatut;

  @IsString()
  @IsOptional()
  diagnostic?: string;

  @IsString()
  @IsOptional()
  solutionAppliquee?: string;

  @IsNumber()
  @IsOptional()
  montantFinal?: number;

  @IsDateString()
  @IsOptional()
  dateRetrait?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PieceReparationDto)
  pieces?: PieceReparationDto[];
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/telephonie/services/telephone.service.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';

@Injectable()
export class TelephoneService {
  constructor(private readonly prisma: PrismaService) { }

  // ── Enregistrer un téléphone (lié à un Article) ──────────────
  async create(tenantId: string, dto: CreateTelephoneDto) {
    // Vérifie que l'article existe
    const article = await this.prisma.article.findFirst({
      where: { id: dto.articleId, tenantId },
    });
    if (!article) throw new NotFoundException('Article introuvable');

    // Vérifie unicité IMEI
    const imeiExisting = await this.prisma.telephone.findUnique({
      where: { imei: dto.imei },
    });
    if (imeiExisting) {
      throw new ConflictException(`IMEI ${dto.imei} déjà enregistré`);
    }

    return this.prisma.telephone.create({
      data: {
        ...dto,
        tenantId,
        dateAchat: dto.dateAchat ? new Date(dto.dateAchat) : null,
      },
      include: {
        article: { select: { designation: true, prixVente: true } },
      },
    });
  }

  // ── Recherche par IMEI ───────────────────────────────────────
  async findByImei(imei: string) {
    const tel = await this.prisma.telephone.findUnique({
      where: { imei },
      include: {
        article: { select: { designation: true, prixVente: true } },
        reparations: {
          select: { id: true, statut: true, probleme: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!tel) throw new NotFoundException(`IMEI ${imei} introuvable`);
    return tel;
  }

  // ── Stock disponible (non vendu) ─────────────────────────────
  async findEnStock(tenantId: string) {
    return this.prisma.telephone.findMany({
      where: { tenantId, vendu: false },
      include: {
        article: { select: { designation: true, prixVente: true, prixAchat: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Marquer comme vendu ──────────────────────────────────────
  async marquerVendu(tenantId: string, id: string) {
    const tel = await this.prisma.telephone.findFirst({ where: { id, tenantId } });
    if (!tel) throw new NotFoundException('Téléphone introuvable');

    return this.prisma.telephone.update({
      where: { id },
      data: { vendu: true, dateVente: new Date() },
    });
  }

  // ── Garanties expirant bientôt ───────────────────────────────
  async getGarantiesExpirantes(tenantId: string, joursAvant = 30) {
    const tels = await this.prisma.telephone.findMany({
      where: { tenantId, vendu: true, dateVente: { not: null } },
      include: {
        article: { select: { designation: true } },
        reparations: { select: { id: true, statut: true }, take: 1 },
      },
    });

    const limite = Date.now() + joursAvant * 24 * 60 * 60 * 1000;

    return tels
      .map((t) => {
        const dateVente = t.dateVente!.getTime();
        const dateExpiry = dateVente + t.garantieMois * 30 * 24 * 60 * 60 * 1000;
        const joursRestants = Math.ceil((dateExpiry - Date.now()) / (1000 * 60 * 60 * 24));
        return { ...t, dateExpiry: new Date(dateExpiry), joursRestants };
      })
      .filter((t) => t.dateExpiry.getTime() <= limite && t.joursRestants > 0)
      .sort((a, b) => a.joursRestants - b.joursRestants);
  }

  // ── Stats stock ──────────────────────────────────────────────
  async statsStock(tenantId: string) {
    const [total, vendus, enStock, parMarque] = await Promise.all([
      this.prisma.telephone.count({ where: { tenantId } }),
      this.prisma.telephone.count({ where: { tenantId, vendu: true } }),
      this.prisma.telephone.count({ where: { tenantId, vendu: false } }),
      this.prisma.telephone.groupBy({
        by: ['marque'],
        where: { tenantId, vendu: false },
        _count: true,
        orderBy: { _count: { marque: 'desc' } },
      }),
    ]);

    return { total, vendus, enStock, parMarque };
  }
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/telephonie/services/reparation.service.ts
// ─────────────────────────────────────────────────────────────────
@Injectable()
export class ReparationService {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, dto: CreateReparationDto) {
    // Vérifie que le client existe
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    // Calcul du total pièces
    const totalPieces = (dto.pieces ?? []).reduce(
      (sum, p) => sum + p.quantite * p.prix, 0
    );

    return this.prisma.reparation.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        telephoneId: dto.telephoneId,
        imei: dto.imei,
        marque: dto.marque,
        modele: dto.modele,
        probleme: dto.probleme,
        diagnostic: dto.diagnostic,
        montantDevis: dto.montantDevis,
        avance: dto.avance ?? 0,
        technicienId: dto.technicienId,
        notes: dto.notes,
        pieces: dto.pieces?.length
          ? {
            create: dto.pieces.map((p) => ({
              articleId: p.articleId,
              nom: p.nom,
              quantite: p.quantite,
              prix: p.prix,
              total: p.quantite * p.prix,
            })),
          }
          : undefined,
      },
      include: {
        client: { select: { nom: true, telephone: true } },
        pieces: true,
      },
    });
  }

  async findAll(tenantId: string, statut?: ReparationStatut) {
    return this.prisma.reparation.findMany({
      where: {
        tenantId,
        ...(statut ? { statut } : {}),
      },
      include: {
        client: { select: { nom: true, telephone: true } },
        pieces: { select: { nom: true, quantite: true, prix: true } },
        _count: { select: { pieces: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const rep = await this.prisma.reparation.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        telephone: true,
        pieces: { include: { article: { select: { designation: true } } } },
      },
    });
    if (!rep) throw new NotFoundException('Réparation introuvable');
    return rep;
  }

  // ── Avancer le statut de réparation ─────────────────────────
  async updateStatut(tenantId: string, id: string, dto: UpdateReparationDto) {
    await this.findOne(tenantId, id);

    // Si ajout de pièces → crée les nouvelles
    const { pieces, ...rest } = dto;

    const updated = await this.prisma.reparation.update({
      where: { id },
      data: {
        ...rest,
        dateRetrait: dto.dateRetrait ? new Date(dto.dateRetrait) : undefined,
        ...(pieces?.length
          ? {
            pieces: {
              create: pieces.map((p) => ({
                articleId: p.articleId,
                nom: p.nom,
                quantite: p.quantite,
                prix: p.prix,
                total: p.quantite * p.prix,
              })),
            },
          }
          : {}),
      },
      include: { pieces: true, client: { select: { nom: true } } },
    });

    return updated;
  }

  // ── Réparations en cours (pour tableau de bord) ──────────────
  async getEnCours(tenantId: string) {
    return this.prisma.reparation.findMany({
      where: {
        tenantId,
        statut: { notIn: ['LIVRE', 'ANNULE', 'IRREPARABLE'] },
      },
      include: {
        client: { select: { nom: true, telephone: true } },
      },
      orderBy: { dateDepot: 'asc' },
    });
  }

  // ── Stats réparations ────────────────────────────────────────
  async stats(tenantId: string) {
    const debut = new Date(); debut.setHours(0, 0, 0, 0);

    const [enCours, livresAujourdhui, recettes] = await Promise.all([
      this.prisma.reparation.count({
        where: { tenantId, statut: { notIn: ['LIVRE', 'ANNULE', 'IRREPARABLE'] } },
      }),
      this.prisma.reparation.count({
        where: { tenantId, statut: 'LIVRE', dateRetrait: { gte: debut } },
      }),
      this.prisma.reparation.aggregate({
        where: { tenantId, statut: 'LIVRE', dateRetrait: { gte: debut } },
        _sum: { montantFinal: true },
      }),
    ]);

    return {
      enCours,
      livresAujourdhui,
      recettesJour: recettes._sum.montantFinal ?? 0,
    };
  }
}