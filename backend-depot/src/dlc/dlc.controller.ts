import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DlcService } from './dlc.service';

@Controller('dlc')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
export class DlcController {
    constructor(private readonly dlcService: DlcService) { }

    @Post('lots')
    creerLot(@Body() body: {
        articleId: string;
        siteId: string;
        tenantId: string;
        quantite: number;
        dlc?: string;
        numeroLot?: string;
    }) {
        return this.dlcService.creerLot({
            ...body,
            dlc: body.dlc ? new Date(body.dlc) : undefined,
        });
    }

    @Get('lots')
    findLots(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId?: string,
    ) {
        return this.dlcService.findLots(tenantId, siteId);
    }

    @Get('alertes')
    getAlertes(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId?: string,
    ) {
        return this.dlcService.getAlertes(tenantId, siteId);
    }

    @Get('stats')
    getStats(
        @Query('tenantId') tenantId: string,
        @Query('siteId') siteId?: string,
    ) {
        return this.dlcService.getStats(tenantId, siteId);
    }

    @Put('lots/:id')
    updateLot(
        @Param('id') id: string,
        @Query('tenantId') tenantId: string,
        @Body() body: { dlc?: string; numeroLot?: string },
    ) {
        return this.dlcService.updateLot(id, tenantId, {
            dlc: body.dlc ? new Date(body.dlc) : undefined,
            numeroLot: body.numeroLot,
        });
    }
}
