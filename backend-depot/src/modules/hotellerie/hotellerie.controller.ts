import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { HotellerieService, CreateTypeChambreDto, CreateChambreDto, CreateReservationDto, CreateConsommationDto, PaginationDto } from './hotellerie.service';

@Controller('hotellerie')
@Metier(MetierType.HOTEL)
@UseGuards(JwtAuthGuard, MetierGuard)
export class HotellerieController {
  constructor(private readonly service: HotellerieService) {}

  @Get('types-chambres')
  async findAllTypes(@Req() req: any) {
    return this.service.findAllTypes(req.user.tenantId);
  }

  @Post('types-chambres')
  async createType(@Req() req: any, @Body() dto: CreateTypeChambreDto) {
    return this.service.createType(req.user.tenantId, dto);
  }

  @Get('chambres')
  async findAllChambres(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllChambres(req.user.tenantId, query);
  }

  @Post('chambres')
  async createChambre(@Req() req: any, @Body() dto: CreateChambreDto) {
    return this.service.createChambre(req.user.tenantId, dto);
  }

  @Post('chambres/:id/statut')
  async updateChambreStatut(@Param('id') id: string, @Body('statut') statut: string) {
    return this.service.updateChambreStatut(id, statut);
  }

  @Get('reservations')
  async findAllReservations(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllReservations(req.user.tenantId, query);
  }

  @Post('reservations')
  async createReservation(@Req() req: any, @Body() dto: CreateReservationDto) {
    return this.service.createReservation(req.user.tenantId, dto);
  }

  @Post('reservations/:id/statut')
  async updateReservationStatut(@Param('id') id: string, @Body('statut') statut: string) {
    return this.service.updateReservationStatut(id, statut);
  }

  @Post('reservations/:id/consommations')
  async addConsommation(@Param('id') id: string, @Body() dto: CreateConsommationDto) {
    return this.service.addConsommation(id, dto);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('config')
  async getConfig() {
    return {};
  }

  @Put('config')
  async updateConfig(@Body() body: any) {
    return body;
  }
}
