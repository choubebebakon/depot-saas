import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  private getTenantId(req: any): string {
    if (!req.user?.tenantId) {
      throw new BadRequestException(
        'Accès refusé : tenantId manquant dans le token.',
      );
    }
    return req.user.tenantId;
  }

  private getDepotId(req: any): string {
    const raw = req.headers?.['x-depot-id'];
    const depotId = Array.isArray(raw) ? raw[0] : raw;
    if (
      !depotId ||
      depotId === 'undefined' ||
      depotId === 'null' ||
      depotId === 'all'
    ) {
      throw new BadRequestException('Dépôt actif requis.');
    }
    return depotId;
  }

  @Post()
  @RequirePermission('clients', 'write')
  create(@Req() req: any, @Body() dto: CreateClientDto) {
    return this.clientsService.create(
      dto,
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Patch(':id')
  @RequirePermission('clients', 'write')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(
      id,
      this.getTenantId(req),
      dto,
      this.getDepotId(req),
    );
  }

  /**
   * Historique d'achats paginé de la fiche client (keyset, limite par défaut
   * issue des paramètres CRM du shop). Le tenantId vient du JWT — jamais de la
   * query (isolation, contrainte n°1 appliquée à la session utilisateur).
   */
  @Get(':id/historique')
  @RequirePermission('clients', 'read')
  historique(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    return this.clientsService.historique(
      id,
      this.getTenantId(req),
      this.getDepotId(req),
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      cursor,
    );
  }

  /** Alias du chemin historique du front (le contrôleur exposait /payer-dette). */
  @Patch(':id/payer')
  @RequirePermission('clients', 'write')
  payer(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.payerDette(req, id, body);
  }

  @Get()
  @RequirePermission('clients', 'read')
  findAll(@Req() req: any, @Query() _query: any) {
    return this.clientsService.findAll(
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Get('stats/ardoise')
  @RequirePermission('clients', 'read')
  statsArdoise(@Req() req: any) {
    return this.clientsService.statsArdoise(
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Get(':id')
  @RequirePermission('clients', 'read')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.clientsService.findOne(
      id,
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Post(':id/payer-dette')
  @RequirePermission('clients', 'write')
  payerDette(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.clientsService.payerDette(
      id,
      Number(body?.montant),
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  /**
   * Suppression : refusée (409) si le client a un historique commercial. Le
   * comptage des références est fait dans le service, sous portée dépôt.
   */
  @Delete(':id')
  @RequirePermission('clients', 'write')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.clientsService.remove(
      id,
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }
}
