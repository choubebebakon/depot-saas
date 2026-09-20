import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UsersService } from './users.service';
import { buildAuditActor } from '../audit/audit-actor.util';

@Controller(':metier/utilisateurs')
@Roles(RoleUser.PATRON, RoleUser.GERANT)
export class MetierUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission('utilisateurs', 'write')
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      role: RoleUser;
      tenantId?: string;
      nom?: string;
      prenom?: string;
      depotId?: string;
    },
    @Req() req: any,
  ) {
    // SÉCURITÉ : un précédent correctif (commit 3e1bb81) avait retiré
    // `body.tenantId` de l'ancien users.controller.ts générique, mais
    // JAMAIS de ce controller-ci — qui est pourtant le seul réellement
    // utilisé par les 3 métiers actifs (`:metier/utilisateurs`). Un
    // GERANT authentifié pouvait donc créer un utilisateur dans
    // N'IMPORTE QUEL AUTRE TENANT simplement en fournissant un
    // `tenantId` différent dans le corps de la requête.
    const tenantId = req.user?.tenantId;
    return this.usersService.create(
      { ...body, tenantId },
      buildAuditActor(req),
    );
  }

  @Get()
  @RequirePermission('utilisateurs', 'read')
  async findAll(@Req() req: any, @Query('depotId') depotId?: string) {
    const effectiveDepotId =
      req.user?.role === RoleUser.PATRON ? depotId : req.user?.depotId;

    if (req.user?.role === RoleUser.GERANT && !effectiveDepotId) {
      throw new ForbiddenException('Ce GERANT n’est affecté à aucun dépôt.');
    }

    return this.usersService.findAll(req.user.tenantId, effectiveDepotId);
  }

  @Get('commerciaux')
  @RequirePermission('utilisateurs', 'read')
  async findCommerciaux(@Req() req: any, @Query('depotId') depotId?: string) {
    const effectiveDepotId =
      req.user?.role === RoleUser.PATRON ? depotId : req.user?.depotId;

    if (req.user?.role === RoleUser.GERANT && !effectiveDepotId) {
      throw new ForbiddenException('Ce GERANT n’est affecté à aucun dépôt.');
    }

    return this.usersService.findCommerciaux(
      req.user.tenantId,
      effectiveDepotId,
    );
  }

  @Get(':id')
  @RequirePermission('utilisateurs', 'read')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const effectiveDepotId =
      req.user?.role === RoleUser.PATRON ? undefined : req.user?.depotId;

    if (req.user?.role === RoleUser.GERANT && !effectiveDepotId) {
      throw new ForbiddenException('Ce GERANT n’est affecté à aucun dépôt.');
    }

    return this.usersService.findOne(req.user.tenantId, id, effectiveDepotId);
  }

  @Patch(':id/status')
  @RequirePermission('utilisateurs', 'write')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Req() req: any,
  ) {
    return this.usersService.updateStatus(
      id,
      body.isActive,
      req.user.tenantId,
      buildAuditActor(req),
    );
  }

  @Patch(':id')
  @RequirePermission('utilisateurs', 'write')
  async update(
    @Param('id') id: string,
    @Body()
    body: { nom?: string; prenom?: string; role?: RoleUser; depotId?: string },
    @Req() req: any,
  ) {
    return this.usersService.update(
      id,
      body,
      req.user.tenantId,
      buildAuditActor(req),
    );
  }

  @Delete(':id')
  @RequirePermission('utilisateurs', 'write')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.usersService.remove(
      id,
      req.user.tenantId,
      buildAuditActor(req),
    );
  }
}
