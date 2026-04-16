import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ArticlesService } from './articles.service';

@Controller('articles')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @Post()
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  create(@Body() createArticleDto: any) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  findAll(@Query('tenantId') tenantId: string) {
    if (tenantId) {
      return this.articlesService.findAllByTenant(tenantId);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }
}
