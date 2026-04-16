import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CreateParametreDto, CalculerCommissionsDto, PayerCommissionDto } from './dto/commission.dto';

@Controller('commissions')
export class CommissionsController {
    constructor(private readonly service: CommissionsService) { }

    @Post('parametre')
    setParametre(@Body() dto: CreateParametreDto) {
        return this.service.setParametre(dto);
    }

    @Get('parametre')
    getParametre(@Query('tenantId') tenantId: string) {
        return this.service.getParametre(tenantId);
    }

    @Post('calculer')
    calculer(@Body() dto: CalculerCommissionsDto) {
        return this.service.calculerCommissions(dto);
    }

    @Get()
    findAll(
        @Query('tenantId') tenantId: string,
        @Query('periode') periode?: string,
    ) {
        return this.service.findCommissions(tenantId, periode);
    }

    @Put(':id/payer')
    payer(@Param('id') id: string, @Body() body: { tenantId: string }) {
        return this.service.payerCommission(id, body.tenantId);
    }

    @Get('stats')
    getStats(@Query('tenantId') tenantId: string) {
        return this.service.getStats(tenantId);
    }
}