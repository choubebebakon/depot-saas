import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() dto: CreateClientDto) {
        return this.clientsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: any, @Query('tenantId') tenantId: string) {
        return this.clientsService.update(id, tenantId, dto);
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
}