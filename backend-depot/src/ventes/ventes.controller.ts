import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVenteDto } from './dto/create-vente.dto';
import { AnnulerVenteDto, ValiderSortieVenteDto } from './dto/validation-vente.dto';
import { VentesService } from './ventes.service';

@Controller('ventes')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
export class VentesController {
  constructor(private readonly ventesService: VentesService) { }

  @Post()
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL)
  async create(@Body() createVenteDto: CreateVenteDto, @CurrentUser() user: any) {
    try {
      return await this.ventesService.createVente(createVenteDto, user);
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      throw error;
    }
  }

  @Get('stats')
  getStats(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.ventesService.getStats(tenantId, depotId);
  }

  @Get('validations/en-attente')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  findEnAttenteValidation(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.ventesService.findEnAttenteValidation(tenantId, depotId);
  }

  @Get()
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('statut') statut?: string,
  ) {
    return this.ventesService.findAll(tenantId, startDate, endDate, depotId, statut);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.ventesService.findOne(id, tenantId, depotId);
  }

  @Patch(':id/valider-sortie')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  async validerSortie(
    @Param('id') id: string,
    @Body() body: ValiderSortieVenteDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.ventesService.validerSortieVente(id, body.tenantId, body.depotId, user);
    } catch (error) {
      console.error(`Erreur lors de la validation sortie (Vente ID: ${id}):`, error);
      throw error;
    }
  }

  @Patch(':id/annuler')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER)
  annuler(
    @Param('id') id: string,
    @Body() body: AnnulerVenteDto,
    @CurrentUser() user: any,
  ) {
    return this.ventesService.annulerVente(id, body.motif, body.tenantId, body.depotId, user);
  }
}
