import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateTypeConsigneDto,
  MouvementConsigneDto,
  RenduSansAchatDto,
  UpdateTypeConsigneDto,
  VenteAvecConsignesDto,
} from './dto/consigne.dto';
import { ConsignesService } from './consignes.service';

@Controller('consignes')
@UseGuards(JwtAuthGuard)
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.MAGASINIER)
export class ConsignesController {
  constructor(private readonly service: ConsignesService) {}

  private getTenantId(req: any): string {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant introuvable dans le contexte authentifié');
    }
    return tenantId;
  }

  private getDepotId(req: any, headerDepotId?: string): string {
    const tokenDepotId = req.user?.depotId || null;
    const requestedDepotId = headerDepotId || tokenDepotId;

    if (!requestedDepotId) {
      throw new BadRequestException('Aucun dépôt actif sélectionné');
    }

    // Un utilisateur affecté à un dépôt ne peut pas changer de périmètre.
    // PATRON/GERANT peuvent utiliser le dépôt actif transmis par le contexte UI.
    const role = req.user?.role;
    const canSwitchDepot = role === RoleUser.PATRON || role === RoleUser.GERANT;
    if (tokenDepotId && tokenDepotId !== requestedDepotId && !canSwitchDepot) {
      throw new BadRequestException('Dépôt non autorisé pour cet utilisateur');
    }

    return requestedDepotId;
  }

  @Post('types')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @RequirePermission('consignes', 'write')
  createType(@Req() req: any, @Body() dto: CreateTypeConsigneDto) {
    return this.service.createTypeConsigne(this.getTenantId(req), dto);
  }

  @Get('types')
  @RequirePermission('consignes', 'read')
  findTypes(@Req() req: any) {
    return this.service.findTypesConsigne(this.getTenantId(req));
  }

  @Put('types/:id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @RequirePermission('consignes', 'write')
  updateType(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTypeConsigneDto,
  ) {
    return this.service.updateTypeConsigne(id, this.getTenantId(req), dto);
  }

  @Get('inventaire')
  @RequirePermission('consignes', 'read')
  getInventaire(@Req() req: any, @Headers('x-depot-id') depotId?: string) {
    return this.service.getInventaireVides(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
    );
  }

  @Get('portefeuilles')
  @RequirePermission('consignes', 'read')
  getAllPortefeuilles(@Req() req: any, @Headers('x-depot-id') depotId?: string) {
    return this.service.getAllPortefeuilles(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
    );
  }

  @Get('portefeuilles/:clientId')
  @RequirePermission('consignes', 'read')
  getPortefeuilleClient(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Headers('x-depot-id') depotId?: string,
  ) {
    return this.service.getPortefeuilleClient(
      clientId,
      this.getTenantId(req),
      this.getDepotId(req, depotId),
    );
  }

  @Post('mouvements')
  @RequirePermission('consignes', 'write')
  enregistrerMouvement(
    @Req() req: any,
    @Headers('x-depot-id') depotId: string | undefined,
    @Body() dto: MouvementConsigneDto,
  ) {
    return this.service.enregistrerMouvement(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
      dto,
    );
  }

  @Get('historique')
  @RequirePermission('consignes', 'read')
  getHistorique(
    @Req() req: any,
    @Headers('x-depot-id') depotId: string | undefined,
    @Query('limit') limit?: string,
  ) {
    return this.service.getHistorique(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Post('vente')
  @RequirePermission('consignes', 'write')
  traiterVenteConsignes(
    @Req() req: any,
    @Headers('x-depot-id') depotId: string | undefined,
    @Body() dto: VenteAvecConsignesDto,
  ) {
    return this.service.traiterVenteConsignes(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
      dto,
    );
  }

  @Post('rendu-sans-achat')
  @RequirePermission('consignes', 'write')
  renduSansAchat(
    @Req() req: any,
    @Headers('x-depot-id') depotId: string | undefined,
    @Body() dto: RenduSansAchatDto,
  ) {
    return this.service.renduSansAchat(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
      dto,
    );
  }

  @Get('stats')
  @RequirePermission('consignes', 'read')
  getStats(@Req() req: any, @Headers('x-depot-id') depotId?: string) {
    return this.service.getStats(
      this.getTenantId(req),
      this.getDepotId(req, depotId),
    );
  }
}
