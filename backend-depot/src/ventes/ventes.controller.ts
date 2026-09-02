import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVenteDto } from './dto/create-vente.dto';
import {
  AnnulerVenteDto,
  ValiderSortieVenteDto,
} from './dto/validation-vente.dto';
import { UpdateVenteDto } from './dto/update-vente.dto';
import { VentesService } from './ventes.service';

@Controller('ventes')
@Roles(
  RoleUser.PATRON,
  RoleUser.GERANT,
  RoleUser.CAISSIER,
  RoleUser.COMMERCIAL,
  RoleUser.MAGASINIER,
)
export class VentesController {
  constructor(private readonly ventesService: VentesService) {}

  private getTenantId(req: any): string {
    if (!req.depotScope?.tenantId || req.depotScope.tenantId !== req.user?.tenantId) {
      throw new BadRequestException('Contexte tenant invalide.');
    }
    return req.depotScope.tenantId;
  }

  private getDepotId(req: any): string {
    const depotId = req.depotScope?.depotId;
    if (!depotId) {
      throw new BadRequestException('Aucun dépôt actif sélectionné.');
    }
    return depotId;
  }

  @Post()
  @Roles(
    RoleUser.PATRON,
    RoleUser.GERANT,
    RoleUser.CAISSIER,
    RoleUser.COMMERCIAL,
  )
  async create(
    @Body() createVenteDto: CreateVenteDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const { tenantId: _clientTenantId, depotId: _clientDepotId, ...saleData } =
      createVenteDto as CreateVenteDto & {
        tenantId?: string;
        depotId?: string;
      };

    return await this.ventesService.createVente(
      {
        ...saleData,
        tenantId: this.getTenantId(req),
        depotId: this.getDepotId(req),
      },
      user,
    );
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.ventesService.getStats(this.getTenantId(req), this.getDepotId(req));
  }

  @Get('validations/en-attente')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  findEnAttenteValidation(@Req() req: any) {
    return this.ventesService.findEnAttenteValidation(this.getTenantId(req), this.getDepotId(req));
  }

  @Get('caisse')
  async getCaisse(@Req() req: any) {
    return this.ventesService.getCaisse(this.getTenantId(req), this.getDepotId(req));
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('statut') statut?: string,
  ) {
    return this.ventesService.findAll(
      this.getTenantId(req),
      startDate,
      endDate,
      this.getDepotId(req),
      statut,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ventesService.findOne(id, this.getTenantId(req), this.getDepotId(req));
  }

  @Patch(':id/valider-sortie')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  async validerSortie(
    @Param('id') id: string,
    @Body() _body: ValiderSortieVenteDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return await this.ventesService.validerSortieVente(
      id,
      this.getTenantId(req),
      this.getDepotId(req),
      user,
    );
  }

  @Patch(':id/annuler')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER)
  annuler(
    @Param('id') id: string,
    @Body() body: AnnulerVenteDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.ventesService.annulerVente(
      id,
      body.motif,
      this.getTenantId(req),
      this.getDepotId(req),
      user,
    );
  }

  @Put(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVenteDto,
    @Req() req: any,
  ) {
    return this.ventesService.update(
      this.getTenantId(req),
      this.getDepotId(req),
      id,
      dto,
    );
  }
}
