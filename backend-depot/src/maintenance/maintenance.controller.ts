import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, CreateCarburantDto } from './dto/maintenance.dto';

@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly service: MaintenanceService) { }

    // Maintenances
    @Post()
    create(@Body() dto: CreateMaintenanceDto) {
        return this.service.createMaintenance(dto);
    }

    @Get()
    findAll(
        @Query('tenantId') tenantId: string,
        @Query('tricycleId') tricycleId?: string,
    ) {
        return this.service.findMaintenances(tenantId, tricycleId);
    }

    @Put(':id/valider')
    valider(@Param('id') id: string) {
        return this.service.validerMaintenance(id);
    }

    @Get('en-retard')
    enRetard(@Query('tenantId') tenantId: string) {
        return this.service.getMaintenancesEnRetard(tenantId);
    }

    // Carburant
    @Post('carburant')
    createCarburant(@Body() dto: CreateCarburantDto) {
        return this.service.createCarburant(dto);
    }

    @Get('carburant')
    findCarburants(
        @Query('tenantId') tenantId: string,
        @Query('tricycleId') tricycleId?: string,
    ) {
        return this.service.findCarburants(tenantId, tricycleId);
    }

    // Stats
    @Get('stats')
    getStats(@Query('tenantId') tenantId: string) {
        return this.service.getStatsTousLesTriycles(tenantId);
    }

    @Get('stats/:tricycleId')
    getStatsTricycle(
        @Param('tricycleId') tricycleId: string,
        @Query('tenantId') tenantId: string,
    ) {
        return this.service.getStatsTricycle(tricycleId, tenantId);
    }
}
