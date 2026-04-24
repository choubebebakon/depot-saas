import { Controller, Get, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RapportsService } from './rapports.service';

@Controller('rapports')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.COMPTABLE)
export class RapportsController {
    constructor(private readonly rapportsService: RapportsService) { }

    @Get('top-produits-marge')
    getTopProduitsParMarge(
        @Query('tenantId') tenantId: string,
        @Query('depotId') depotId: string,
        @Query('month') month?: string,
    ) {
        return this.rapportsService.getTopProduitsParMarge(tenantId, depotId, month);
    }

    @Get('performance-commerciaux')
    getPerformanceCommerciaux(
        @Query('tenantId') tenantId: string,
        @Query('depotId') depotId: string,
        @Query('month') month?: string,
    ) {
        return this.rapportsService.getPerformanceCommerciaux(tenantId, depotId, month);
    }

    @Get('point-mort')
    getPointMortMensuel(
        @Query('tenantId') tenantId: string,
        @Query('depotId') depotId: string,
        @Query('month') month?: string,
    ) {
        return this.rapportsService.getPointMortMensuel(tenantId, depotId, month);
    }
}
