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
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { buildAuditActor } from '../audit/audit-actor.util';

@Controller('users')
@Roles(RoleUser.PATRON, RoleUser.GERANT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      role: RoleUser;
      tenantId?: string;
      nom?: string;
      depotId?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.usersService.create({ ...body, tenantId }, buildAuditActor(req));
  }

  // Création d'un employé (alias de POST / avec rôle imposé)
  @Post('employees')
  async createEmployee(
    @Body()
    body: {
      email: string;
      password: string;
      role: RoleUser;
      tenantId?: string;
      nom?: string;
      depotId?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.usersService.create({ ...body, tenantId }, buildAuditActor(req));
  }

  @Get()
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId?: string,
  ) {
    return this.usersService.findAll(tenantId, depotId);
  }

  @Get('commerciaux')
  async findCommerciaux(@Query('tenantId') tenantId: string) {
    return this.usersService.findCommerciaux(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.usersService.findOne(tenantId, id);
  }

  // Activation / Désactivation d'un utilisateur
  @Patch(':id/status')
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

  // Mise à jour d'un utilisateur (rôle, nom, dépôt)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { nom?: string; role?: RoleUser; depotId?: string },
    @Req() req: any,
  ) {
    return this.usersService.update(
      id,
      body,
      req.user.tenantId,
      buildAuditActor(req),
    );
  }

  // Suppression d'un utilisateur
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.usersService.remove(id, req.user.tenantId, buildAuditActor(req));
  }
}