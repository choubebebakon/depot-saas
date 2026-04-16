import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
    ChargerTourneeDto,
    ClotureCommercialeDto,
    CreateTricycleDto,
    OuvrirTourneeDto,
    ValidationMagasinierDto,
} from './dto/tournee.dto';
import { TourneesService } from './tournees.service';

@Controller('tournees')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
export class TourneesController {
    constructor(private readonly service: TourneesService) { }

    @Post('tricycles')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    createTricycle(@Body() dto: CreateTricycleDto) {
        return this.service.createTricycle(dto);
    }

    @Get('tricycles')
    findTricycles(@Query('tenantId') tenantId: string) {
        return this.service.findTricycles(tenantId);
    }

    @Post('ouvrir')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    ouvrirTournee(@Body() dto: OuvrirTourneeDto) {
        return this.service.ouvrirTournee(dto);
    }

    @Post('charger')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    chargerTournee(@Body() dto: ChargerTourneeDto) {
        return this.service.chargerTournee(dto);
    }

    @Post('cloture-commerciale')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.COMMERCIAL)
    clotureCommerciale(@Body() dto: ClotureCommercialeDto) {
        return this.service.clotureCommerciale(dto);
    }

    @Post('valider-magasinier')
    @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
    validerMagasinier(@Body() dto: ValidationMagasinierDto) {
        return this.service.validerMagasinier(dto);
    }

    @Get('stats')
    stats(@Query('tenantId') tenantId: string) {
        return this.service.statsTournees(tenantId);
    }

    @Get()
    findAll(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId?: string,
        @Query('statut') statut?: string,
    ) {
        return this.service.findAll(tenantId, siteId, statut);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
        return this.service.findOne(id, tenantId);
    }
}
