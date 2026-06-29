import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import {
  ElevageService,
  CreateLotElevageDto,
  UpdateLotElevageDto,
  CreateEvenementElevageDto,
  CreateAlimentationElevageDto,
  PaginationDto,
} from './elevage.service';

@Controller('elevage')
@Metier(MetierType.ELEVAGE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class ElevageController {
  constructor(private readonly elevageService: ElevageService) {}

  @Post('/lots-elevage')
  async createLot(
    @Req() req: any,
    @Body() createLotElevageDto: CreateLotElevageDto,
  ) {
    return this.elevageService.createLot(
      req.user.tenantId,
      createLotElevageDto,
    );
  }

  @Get('/lots-elevage')
  async findAllLots(@Req() req: any, @Query() paginationDto: PaginationDto) {
    return this.elevageService.findAllLots(req.user.tenantId, paginationDto);
  }

  @Get('/lots-elevage/:id')
  async findOneLot(@Req() req: any, @Param('id') id: string) {
    return this.elevageService.findOneLot(req.user.tenantId, id);
  }

  @Patch('/lots-elevage/:id')
  async updateLot(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateLotElevageDto: UpdateLotElevageDto,
  ) {
    return this.elevageService.updateLot(
      req.user.tenantId,
      id,
      updateLotElevageDto,
    );
  }

  @Post('/lots-elevage/:id/evenements')
  async addEvenement(
    @Req() req: any,
    @Param('id') lotId: string,
    @Body() createEvenementElevageDto: CreateEvenementElevageDto,
  ) {
    return this.elevageService.addEvenement(
      req.user.tenantId,
      lotId,
      createEvenementElevageDto,
    );
  }

  @Get('/lots-elevage/:id/historique')
  async getEvenementsHistorique(
    @Req() req: any,
    @Param('id') lotId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.elevageService.getEvenementsHistorique(
      req.user.tenantId,
      lotId,
      paginationDto,
    );
  }

  @Post('/lots-elevage/:id/alimentation')
  async recordAlimentation(
    @Req() req: any,
    @Param('id') lotId: string,
    @Body() createAlimentationElevageDto: CreateAlimentationElevageDto,
  ) {
    return this.elevageService.recordAlimentation(
      req.user.tenantId,
      lotId,
      createAlimentationElevageDto,
    );
  }

  @Delete('/lots-elevage/:id')
  async removeLot(@Req() req: any, @Param('id') id: string) {
    return this.elevageService.deleteLot(req.user.tenantId, id);
  }

  @Get('/stats')
  async getElevageStats(@Req() req: any) {
    return this.elevageService.getElevageStats(req.user.tenantId);
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

  // --- Stubs Phase 4 ---

  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: Record<string, unknown>) {
    return body;
  }

  @Get('caisse')
  async getCaisse() {
    return { solde: 0, totalEntrees: 0, totalSorties: 0 };
  }
}
