import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CATEGORIES_PAR_TYPE } from '../../../prisma/seeds/categoriesBoutique';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query?: { actif?: string | boolean }) {
    const where: any = { tenantId };

    if (query?.actif !== undefined) {
      const actif = query.actif === true || query.actif === 'true';
      where.actif = actif;
    }

    return this.prisma.categorie.findMany({
      where,
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
      include: { _count: { select: { articles: true } } },
    });
  }

  async findOne(tenantId: string, id: string) {
    const categorie = await this.prisma.categorie.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { articles: true } } },
    });

    if (!categorie) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    return categorie;
  }

  async create(tenantId: string, dto: CreateCategorieDto) {
    const nom = dto.nom.trim();
    if (!nom) throw new BadRequestException('Le nom de la catégorie est requis.');

    await this.ensureUniqueName(tenantId, nom);

    return this.prisma.categorie.create({
      data: {
        tenantId,
        nom,
        description: dto.description?.trim() || null,
        couleur: dto.couleur || '#6366f1',
        icone: dto.icone?.trim() || '🏷️',
        ordre: dto.ordre ?? 0,
        actif: dto.actif ?? true,
      },
      include: { _count: { select: { articles: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCategorieDto) {
    await this.findOne(tenantId, id);

    const data: Record<string, unknown> = {};

    if (dto.nom !== undefined) {
      const nom = dto.nom.trim();
      if (!nom) throw new BadRequestException('Le nom de la catégorie est requis.');
      await this.ensureUniqueName(tenantId, nom, id);
      data.nom = nom;
    }

    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.couleur !== undefined) data.couleur = dto.couleur || null;
    if (dto.icone !== undefined) data.icone = dto.icone?.trim() || null;
    if (dto.ordre !== undefined) data.ordre = dto.ordre;
    if (dto.actif !== undefined) data.actif = dto.actif;

    return this.prisma.categorie.update({
      where: { id },
      data,
      include: { _count: { select: { articles: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const articleCount = await this.prisma.article.count({
      where: { categorieId: id, tenantId },
    });

    if (articleCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette catégorie : ${articleCount} article(s) l'utilisent. Désactivez-la plutôt.`,
      );
    }

    return this.prisma.categorie.delete({ where: { id } });
  }

  async seedByType(tenantId: string, typeBoutique: string) {
    const normalizedType = typeBoutique.trim().toLowerCase();
    const categories = CATEGORIES_PAR_TYPE[normalizedType];

    if (!categories) {
      throw new BadRequestException(`Type de boutique invalide : ${typeBoutique}.`);
    }

    let created = 0;
    let skipped = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const [index, category] of categories.entries()) {
        const existing = await tx.categorie.findFirst({
          where: { tenantId, nom: { equals: category.nom, mode: 'insensitive' } },
          select: { id: true },
        });

        if (existing) {
          skipped += 1;
          continue;
        }

        await tx.categorie.create({
          data: {
            tenantId,
            nom: category.nom,
            icone: category.icone,
            couleur: category.couleur,
            ordre: index,
            actif: true,
          },
        });
        created += 1;
      }
    });

    return { created, skipped, type: normalizedType };
  }

  private async ensureUniqueName(tenantId: string, nom: string, excludeId?: string) {
    const existing = await this.prisma.categorie.findFirst({
      where: {
        tenantId,
        nom: { equals: nom, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Une catégorie nommée « ${nom} » existe déjà.`);
    }
  }
}
