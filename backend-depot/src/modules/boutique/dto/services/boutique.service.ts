// ═════════════════════════════════════════════════════════════════
// BOUTIQUE — DTOs + Service
// Réutilise : Article, Client, Vente, Fournisseur, SessionCaisse
// Ajoute : Promotion, CreditClient
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/boutique/dto/create-promotion.dto.ts
// ─────────────────────────────────────────────────────────────────
import { IsEnum, IsNumber, IsString, IsDateString, IsBoolean, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PromotionType {
  POURCENTAGE  = 'POURCENTAGE',
  MONTANT_FIXE = 'MONTANT_FIXE',
  PRIX_FIXE    = 'PRIX_FIXE',
}

export class CreatePromotionDto {
  @IsString()
  articleId: string;

  @IsString()
  nom: string;

  @IsEnum(PromotionType)
  @Transform(({ value }) => value?.toUpperCase())
  type: PromotionType;

  @IsNumber()
  @Min(0)
  valeur: number;         // % ou montant selon type

  @IsNumber()
  @Min(0)
  prixPromo: number;      // Prix final calculé

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean = true;
}

export class UpdatePromotionDto {
  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  prixPromo?: number;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/boutique/dto/credit-client.dto.ts
// ─────────────────────────────────────────────────────────────────
import { IsString as IsStr, IsNumber as IsNum, IsEnum as IsEnu, Min as Min2 } from 'class-validator';

export enum CreditType {
  AJOUT         = 'AJOUT',
  DEDUCTION     = 'DEDUCTION',
  REMBOURSEMENT = 'REMBOURSEMENT',
}

export class MouvementCreditDto {
  @IsStr()
  clientId: string;

  @IsNum()
  @Min2(0)
  montant: number;

  @IsEnu(CreditType)
  type: CreditType;

  @IsStr()
  description?: string;
}

export class SetPlafondCreditDto {
  @IsStr()
  clientId: string;

  @IsNum()
  @Min2(0)
  plafond: number;
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/boutique/services/promotions.service.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Créer une promotion ─────────────────────────────────────
  async create(tenantId: string, dto: CreatePromotionDto) {
    // Vérifie que l'article existe et appartient au tenant
    const article = await this.prisma.article.findFirst({
      where: { id: dto.articleId, tenantId },
    });
    if (!article) throw new NotFoundException('Article introuvable');

    // Vérifie pas de doublon actif sur le même article
    const existing = await this.prisma.promotion.findFirst({
      where: {
        articleId: dto.articleId,
        tenantId,
        actif: true,
        dateFin: { gte: new Date() },
      },
    });
    if (existing) {
      throw new BadRequestException('Une promotion active existe déjà pour cet article');
    }

    return this.prisma.promotion.create({
      data: { ...dto, tenantId, dateDebut: new Date(dto.dateDebut), dateFin: new Date(dto.dateFin) },
      include: { article: { select: { designation: true, prixVente: true } } },
    });
  }

  // ── Liste des promotions actives ────────────────────────────
  async findActives(tenantId: string) {
    return this.prisma.promotion.findMany({
      where: {
        tenantId,
        actif: true,
        dateFin: { gte: new Date() },
        dateDebut: { lte: new Date() },
      },
      include: { article: { select: { designation: true, prixVente: true } } },
      orderBy: { dateFin: 'asc' },
    });
  }

  // ── Toutes les promotions (actives + expirées) ──────────────
  async findAll(tenantId: string) {
    return this.prisma.promotion.findMany({
      where: { tenantId },
      include: { article: { select: { designation: true, prixVente: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Désactiver une promotion ────────────────────────────────
  async desactiver(tenantId: string, id: string) {
    await this.assertExists(tenantId, id);
    return this.prisma.promotion.update({
      where: { id },
      data: { actif: false },
    });
  }

  // ── Prix promo d'un article (si promotion active) ───────────
  async getPrixPromo(tenantId: string, articleId: string): Promise<number | null> {
    const promo = await this.prisma.promotion.findFirst({
      where: {
        tenantId,
        articleId,
        actif: true,
        dateFin: { gte: new Date() },
        dateDebut: { lte: new Date() },
      },
    });
    return promo?.prixPromo ?? null;
  }

  private async assertExists(tenantId: string, id: string) {
    const p = await this.prisma.promotion.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Promotion introuvable');
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────
// 📁 src/modules/boutique/services/credit-client.service.ts
// ─────────────────────────────────────────────────────────────────
@Injectable()
export class CreditClientService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Récupère ou crée le crédit d'un client ──────────────────
  async getOrCreate(tenantId: string, clientId: string) {
    return this.prisma.creditClient.upsert({
      where: { clientId },
      create: { tenantId, clientId, solde: 0, plafond: 50000 },
      update: {},
      include: { historique: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  // ── Ajouter du crédit ───────────────────────────────────────
  async ajouterCredit(tenantId: string, dto: MouvementCreditDto) {
    const credit = await this.getOrCreate(tenantId, dto.clientId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.creditClient.update({
        where: { id: credit.id },
        data: { solde: { increment: dto.montant } },
      }),
      this.prisma.historiqueCredit.create({
        data: {
          creditClientId: credit.id,
          montant: dto.montant,
          type: CreditType.AJOUT,
          description: dto.description,
        },
      }),
    ]);
    return updated;
  }

  // ── Utiliser du crédit (déduction) ─────────────────────────
  async utiliserCredit(tenantId: string, dto: MouvementCreditDto) {
    const credit = await this.getOrCreate(tenantId, dto.clientId);

    if (credit.solde < dto.montant) {
      throw new BadRequestException(
        `Crédit insuffisant. Solde : ${credit.solde} FCFA, Requis : ${dto.montant} FCFA`
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.creditClient.update({
        where: { id: credit.id },
        data: { solde: { decrement: dto.montant } },
      }),
      this.prisma.historiqueCredit.create({
        data: {
          creditClientId: credit.id,
          montant: -dto.montant,
          type: CreditType.DEDUCTION,
          description: dto.description,
        },
      }),
    ]);
    return updated;
  }

  // ── Modifier le plafond ─────────────────────────────────────
  async setPlafond(tenantId: string, dto: SetPlafondCreditDto) {
    const credit = await this.getOrCreate(tenantId, dto.clientId);
    return this.prisma.creditClient.update({
      where: { id: credit.id },
      data: { plafond: dto.plafond },
    });
  }
}