import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { CreateReceptionDto } from './dto/create-reception.dto';
import { FournisseursService } from './fournisseurs.service';

@Controller('fournisseurs')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER, RoleUser.COMPTABLE)
export class FournisseursController {
    constructor(private readonly service: FournisseursService) { }

    @Post()
    createFournisseur(@Body() dto: CreateFournisseurDto) {
        return this.service.createFournisseur(dto);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string) {
        return this.service.findAllFournisseurs(tenantId);
    }

    @Get('stats')
    stats(@Query('tenantId') tenantId: string) {
        return this.service.statsFournisseurs(tenantId);
    }

    @Post('receptions')
    createReception(@Body() dto: CreateReceptionDto) {
        return this.service.createReception(dto);
    }

    @Get('receptions')
    findReceptions(
        @Query('tenantId') tenantId: string,
        @Query('depotId') depotId: string,
    ) {
        return this.service.findAllReceptions(tenantId, depotId);
    }
}
