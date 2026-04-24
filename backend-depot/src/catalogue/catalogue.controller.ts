import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateArticleDto, CreateFamilleDto, CreateMarqueDto, UpdateArticleDto } from './dto/catalogue.dto';
import { CatalogueService } from './catalogue.service';

@Controller('catalogue')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
export class CatalogueController {
    constructor(private readonly service: CatalogueService) { }

    @Post('familles')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    createFamille(@Body() dto: CreateFamilleDto) {
        return this.service.createFamille(dto);
    }

    @Get('familles')
    findFamilles(@Query('tenantId') tenantId: string) {
        return this.service.findFamilles(tenantId);
    }

    @Delete('familles/:id')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    deleteFamille(@Param('id') id: string, @Query('tenantId') tenantId: string) {
        return this.service.deleteFamille(id, tenantId);
    }

    @Post('marques')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    createMarque(@Body() dto: CreateMarqueDto) {
        return this.service.createMarque(dto);
    }

    @Get('marques')
    findMarques(
        @Query('tenantId') tenantId: string,
        @Query('familleId') familleId?: string,
    ) {
        return this.service.findMarques(tenantId, familleId);
    }

    @Post('articles')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    createArticle(@Body() dto: CreateArticleDto) {
        return this.service.createArticle(dto);
    }

    @Get('articles')
    findArticles(
        @Query('tenantId') tenantId: string,
        @Query('familleId') familleId?: string,
        @Query('marqueId') marqueId?: string,
    ) {
        return this.service.findArticles(tenantId, familleId, marqueId);
    }

    @Put('articles/:id')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    updateArticle(
        @Param('id') id: string,
        @Query('tenantId') tenantId: string,
        @Body() dto: UpdateArticleDto,
    ) {
        return this.service.updateArticle(id, tenantId, dto);
    }

    @Get('stocks-convertis')
    getStockConverti(
        @Query('tenantId') tenantId: string,
        @Query('depotId') depotId?: string,
    ) {
        return this.service.getStockConverti(tenantId, depotId);
    }
}
