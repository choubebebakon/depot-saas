import { Body, Controller, Get, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @Post()
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  async create(@Body() createArticleDto: any) {
    // Vérification de sécurité minimale
    if (!createArticleDto.tenantId) {
      throw new BadRequestException("Le tenantId est obligatoire pour créer un article.");
    }

    // On s'assure que la désignation est propre
    if (!createArticleDto.designation) {
      throw new BadRequestException("La désignation de l'article est requise.");
    }

    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
  async findAll(@Query('tenantId') tenantId: string) {
    if (!tenantId) {
      return [];
    }
    return this.articlesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
  async findOne(@Param('id') id: string) {
    const article = await this.articlesService.findOne(id);
    if (!article) {
      throw new BadRequestException("Article introuvable.");
    }
    return article;
  }
}
