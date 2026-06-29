import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Patch,
  Param,
  Put,
} from '@nestjs/common';
import { CimentBtpService, PaginationDto } from './ciment-btp.service';
import {
  CreateVehiculeBtpDto,
  CreateLivraisonBtpDto,
  UpdateLivraisonStatutDto,
} from './dto/ciment-btp.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('ciment-btp')
@Metier(MetierType.CIMENT_BTP)
@UseGuards(JwtAuthGuard, MetierGuard)
export class CimentBtpController {
  constructor(private service: CimentBtpService) {}

  @Get('vehicules')
  async findAllVehicules(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllVehicules(req.user.tenantId, query);
  }

  @Post('vehicules')
  async createVehicule(@Req() req: any, @Body() data: CreateVehiculeBtpDto) {
    return this.service.createVehicule(req.user.tenantId, data);
  }

  @Patch('vehicules/:id/disponibilite')
  async updateVehiculeDispo(
    @Req() req: any,
    @Param('id') id: string,
    @Body('disponible') disponible: boolean,
  ) {
    return this.service.updateVehiculeDisponibilite(
      id,
      req.user.tenantId,
      disponible,
    );
  }

  @Get('livraisons')
  async findAllLivraisons(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllLivraisons(req.user.tenantId, query);
  }

  @Post('livraisons')
  async createLivraison(@Req() req: any, @Body() data: CreateLivraisonBtpDto) {
    return this.service.createLivraison(req.user.tenantId, data);
  }

  @Patch('livraisons/:id/statut')
  async updateLivraisonStatut(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateLivraisonStatutDto,
  ) {
    return this.service.updateLivraisonStatut(id, req.user.tenantId, data);
  }

  @Get('livraisons/chantier/:id')
  async getLivraisonsByChantier(@Req() req: any, @Param('id') id: string) {
    return this.service.getLivraisonsByChantier(id, req.user.tenantId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
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

  @Get('config')
  async getConfig() {
    return {};
  }

  @Get('caisse')
  async getCaisse() {
    return { solde: 0, totalEntrees: 0, totalSorties: 0 };
  }
}
