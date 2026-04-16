import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CaisseService } from './caisse.service';
import { CreateDepenseDto, FermerCaisseDto, OuvrirCaisseDto } from './dto/caisse.dto';

@Controller('caisse')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMPTABLE)
export class CaisseController {
    constructor(private readonly caisseService: CaisseService) { }

    @Post('ouvrir')
    ouvrirSession(@Body() dto: OuvrirCaisseDto) {
        return this.caisseService.ouvrirSession(dto);
    }

    @Post('fermer')
    fermerSession(@Body() dto: FermerCaisseDto) {
        return this.caisseService.fermerSession(dto);
    }

    @Get('session-active')
    getSessionActive(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId: string,
    ) {
        return this.caisseService.getSessionActive(tenantId, siteId);
    }

    @Get('historique')
    getHistorique(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId: string,
    ) {
        return this.caisseService.getHistorique(tenantId, siteId);
    }

    @Get('resume')
    getResume(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId: string,
    ) {
        return this.caisseService.getResume(tenantId, siteId);
    }

    @Post('depenses')
    createDepense(@Body() dto: CreateDepenseDto) {
        return this.caisseService.createDepense(dto);
    }

    @Get('depenses')
    getDepenses(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId: string,
        @Query('dateDebut') dateDebut?: string,
        @Query('dateFin') dateFin?: string,
    ) {
        return this.caisseService.getDepenses(tenantId, siteId, dateDebut, dateFin);
    }
}
