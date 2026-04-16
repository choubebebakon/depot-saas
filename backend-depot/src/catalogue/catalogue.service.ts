import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFamilleDto, CreateMarqueDto, CreateArticleDto, UpdateArticleDto } from './dto/catalogue.dto';

@Injectable()
export class CatalogueService {
    constructor(private prisma: PrismaService) { }

    // ── Familles ─────────────────────────────────────────────

    async createFamille(dto: CreateFamilleDto) {
        return this.prisma.famille.create({
            data: { nom: dto.nom, emoji: dto.emoji || '📦', tenantId: dto.tenantId },
        });
    }

    async findFamilles(tenantId: string) {
        return this.prisma.famille.findMany({
            where: { tenantId },
            include: {
                marques: {
                    include: {
                        _count: { select: { articles: true } },
                    },
                },
                _count: { select: { articles: true } },
            },
            orderBy: { nom: 'asc' },
        });
    }

    async deleteFamille(id: string, tenantId: string) {
        const famille = await this.prisma.famille.findFirst({ where: { id, tenantId } });
        if (!famille) throw new BadRequestException('Famille introuvable');
        return this.prisma.famille.delete({ where: { id } });
    }

    // ── Marques ──────────────────────────────────────────────

    async createMarque(dto: CreateMarqueDto) {
        return this.prisma.marque.create({
            data: { nom: dto.nom, familleId: dto.familleId, tenantId: dto.tenantId },
            include: { famille: true },
        });
    }

    async findMarques(tenantId: string, familleId?: string) {
        return this.prisma.marque.findMany({
            where: { tenantId, ...(familleId ? { familleId } : {}) },
            include: {
                famille: true,
                _count: { select: { articles: true } },
            },
            orderBy: { nom: 'asc' },
        });
    }

    // ── Articles ─────────────────────────────────────────────

    async createArticle(dto: CreateArticleDto) {
        return this.prisma.article.create({
            data: {
                designation: dto.designation,
                format: dto.format || '',
                prixVente: dto.prixVente,
                prixAchat: dto.prixAchat,
                seuilCritique: dto.seuilCritique || 0,
                estConsigne: dto.estConsigne || false,
                uniteParCasier: dto.uniteParCasier || 12,
                uniteParPack: dto.uniteParPack || 6,
                uniteParPalette: dto.uniteParPalette || 120,
                familleId: dto.familleId || null,
                marqueId: dto.marqueId || null,
                tenantId: dto.tenantId,
            },
            include: { famille: true, marque: true },
        });
    }

    async findArticles(tenantId: string, familleId?: string, marqueId?: string) {
        return this.prisma.article.findMany({
            where: {
                tenantId,
                ...(familleId ? { familleId } : {}),
                ...(marqueId ? { marqueId } : {}),
            },
            include: {
                famille: true,
                marque: true,
                stocks: { include: { site: true } },
            },
            orderBy: [
                { famille: { nom: 'asc' } },
                { marque: { nom: 'asc' } },
                { designation: 'asc' },
            ],
        });
    }

    async updateArticle(id: string, tenantId: string, dto: UpdateArticleDto) {
        const article = await this.prisma.article.findFirst({ where: { id, tenantId } });
        if (!article) throw new BadRequestException('Article introuvable');

        return this.prisma.article.update({
            where: { id },
            data: {
                ...(dto.designation !== undefined && { designation: dto.designation }),
                ...(dto.format !== undefined && { format: dto.format }),
                ...(dto.prixVente !== undefined && { prixVente: dto.prixVente }),
                ...(dto.prixAchat !== undefined && { prixAchat: dto.prixAchat }),
                ...(dto.seuilCritique !== undefined && { seuilCritique: dto.seuilCritique }),
                ...(dto.estConsigne !== undefined && { estConsigne: dto.estConsigne }),
                ...(dto.uniteParCasier !== undefined && { uniteParCasier: dto.uniteParCasier }),
                ...(dto.uniteParPack !== undefined && { uniteParPack: dto.uniteParPack }),
                ...(dto.uniteParPalette !== undefined && { uniteParPalette: dto.uniteParPalette }),
                ...(dto.familleId !== undefined && { familleId: dto.familleId }),
                ...(dto.marqueId !== undefined && { marqueId: dto.marqueId }),
            },
            include: { famille: true, marque: true },
        });
    }

    // ── Conversion utilitaire ────────────────────────────────

    convertirUnites(quantiteBouteilles: number, article: any) {
        const { uniteParPalette, uniteParCasier, uniteParPack } = article;

        const palettes = Math.floor(quantiteBouteilles / uniteParPalette);
        const resteApresPalette = quantiteBouteilles % uniteParPalette;
        const casiers = Math.floor(resteApresPalette / uniteParCasier);
        const resteApresCasier = resteApresPalette % uniteParCasier;
        const packs = Math.floor(resteApresCasier / uniteParPack);
        const bouteilles = resteApresCasier % uniteParPack;

        return { palettes, casiers, packs, bouteilles, total: quantiteBouteilles };
    }

    // Stock avec affichage converti
    async getStockConverti(tenantId: string, siteId?: string) {
        const stocks = await this.prisma.stock.findMany({
            where: {
                article: { tenantId },
                ...(siteId ? { siteId } : {}),
            },
            include: {
                article: { include: { famille: true, marque: true } },
                site: true,
            },
        });

        return stocks.map(s => ({
            ...s,
            converti: this.convertirUnites(s.quantite, s.article),
            affichage: this.formaterAffichage(s.quantite, s.article),
        }));
    }

    formaterAffichage(quantite: number, article: any): string {
        const { palettes, casiers, bouteilles } = this.convertirUnites(quantite, article);
        const parts: string[] = [];
        if (palettes > 0) parts.push(`${palettes} palette${palettes > 1 ? 's' : ''}`);
        if (casiers > 0) parts.push(`${casiers} casier${casiers > 1 ? 's' : ''}`);
        if (bouteilles > 0) parts.push(`${bouteilles} bouteille${bouteilles > 1 ? 's' : ''}`);
        return parts.length > 0 ? parts.join(' + ') : '0 bouteille';
    }
}