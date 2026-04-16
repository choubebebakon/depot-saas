import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientsService } from './clients.service';

@Controller('clients')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.COMPTABLE)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() dto: CreateClientDto) {
        return this.clientsService.create(dto);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string) {
        return this.clientsService.findAll(tenantId);
    }

    @Get('stats/ardoise')
    statsArdoise(@Query('tenantId') tenantId: string) {
        return this.clientsService.statsArdoise(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
        return this.clientsService.findOne(id, tenantId);
    }

    @Patch(':id/payer')
    payerDette(
        @Param('id') id: string,
        @Body() body: { montant: number; tenantId: string },
    ) {
        return this.clientsService.payerDette(id, body.montant, body.tenantId);
    }
}
