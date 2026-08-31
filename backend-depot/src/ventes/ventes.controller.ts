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
import { DepotScopeService } from '../common/depot-scope.service';
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
  constructor(
    private readonly ventesService: VentesService,
    private readonly depotScope: DepotScopeService,
  ) {}

  private getTenantId(user: any): string {
    if (!user?.tenantId) {
      throw new BadRequestException('Accès refusé : tenantId manquant dans le token.');
    }
    return user.tenantId;
  }

  private getDepotId(): string {
    const depotId = this.depotScope.getDepotId();
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
  ) {
    try {
      const tenantId = this.getTenantId(user);
      const depotId = this.getDepotId();
      return await this.ventesService.createVente(
        {
          ...createVenteDto,
          tenantId,
          depotId,
        },
        user,
      );
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      throw error;
    }
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.ventesService.getStats(
      this.getTenantId(user),
      this.getDepotId(),
    );
  }

  @Get('validations/en-attente')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  findEnAttenteValidation(@CurrentUser() user: any) {
    return this.ventesService.findEnAttenteValidation(
      this.getTenantId(user),
      this.getDepotId(),
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('statut') statut?: string,
  ) {
    return this.ventesService.findAll(
      this.getTenantId(user),
      startDate,
      endDate,
      this.getDepotId(),
      statut,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ventesService.findOne(
      id,
      this.getTenantId(user),
      this.getDepotId(),
    );
  }

  @Patch(':id/valider-sortie')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
  async validerSortie(
    @Param('id') id: string,
    @Body() _body: ValiderSortieVenteDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.ventesService.validerSortieVente(
        id,
        this.getTenantId(user),
        this.getDepotId(),
        user,
      );
    } catch (error) {
      console.error(
        `Erreur lors de la validation sortie (Vente ID: ${id}):`,
        error,
      );
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
    return this.ventesService.annulerVente(
      id,
      body.motif,
      this.getTenantId(user),
      this.getDepotId(),
      user,
    );
  }

  @Get('caisse')
  async getCaisse(@CurrentUser() user: any) {
    return this.ventesService.getCaisse(
      this.getTenantId(user),
      this.getDepotId(),
    );
  }

  @Put(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVenteDto,
    @CurrentUser() user: any,
  ) {
    return this.ventesService.update(this.getTenantId(user), id, dto);
  }
}
