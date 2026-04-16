import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
    CreateTypeConsigneDto,
    MouvementConsigneDto,
    RenduSansAchatDto,
    UpdateTypeConsigneDto,
    VenteAvecConsignesDto,
} from './dto/consigne.dto';
import { ConsignesService } from './consignes.service';

@Controller('consignes')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.MAGASINIER)
export class ConsignesController {
    constructor(private readonly service: ConsignesService) { }

    @Post('types')
    @Roles(RoleUser.PATRON, RoleUser.GERANT)
    createType(@Body() dto: CreateTypeConsigneDto) {
        return this.service.createTypeConsigne(dto);
    }

    @Get('types')
    findTypes(@Query('tenantId') tenantId: string) {
        return this.service.findTypesConsigne(tenantId);
    }

    @Put('types/:id')
    @Roles(RoleUser.PATRON, RoleUser.GERANT)
    updateType(
        @Param('id') id: string,
        @Query('tenantId') tenantId: string,
        @Body() dto: UpdateTypeConsigneDto,
    ) {
        return this.service.updateTypeConsigne(id, tenantId, dto);
    }

    @Get('inventaire')
    getInventaire(@Query('tenantId') tenantId: string) {
        return this.service.getInventaireVides(tenantId);
    }

    @Get('portefeuilles')
    getAllPortefeuilles(@Query('tenantId') tenantId: string) {
        return this.service.getAllPortefeuilles(tenantId);
    }

    @Get('portefeuilles/:clientId')
    getPortefeuilleClient(
        @Param('clientId') clientId: string,
        @Query('tenantId') tenantId: string,
    ) {
        return this.service.getPortefeuilleClient(clientId, tenantId);
    }

    @Post('mouvements')
    enregistrerMouvement(@Body() dto: MouvementConsigneDto) {
        return this.service.enregistrerMouvement(dto);
    }

    @Get('historique')
    getHistorique(
        @Query('tenantId') tenantId: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.getHistorique(tenantId, limit ? parseInt(limit, 10) : 100);
    }

    @Post('vente')
    traiterVenteConsignes(@Body() dto: VenteAvecConsignesDto) {
        return this.service.traiterVenteConsignes(dto);
    }

    @Post('rendu-sans-achat')
    renduSansAchat(@Body() dto: RenduSansAchatDto) {
        return this.service.renduSansAchat(dto);
    }

    @Get('stats')
    getStats(@Query('tenantId') tenantId: string) {
        return this.service.getStats(tenantId);
    }
}
