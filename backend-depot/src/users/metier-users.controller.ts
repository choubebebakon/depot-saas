import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller(':metier/utilisateurs')
@Roles(RoleUser.PATRON, RoleUser.GERANT)
export class MetierUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body: { email: string; password: string; role: RoleUser; tenantId?: string; nom?: string; prenom?: string; depotId?: string }, @Req() req: any) {
    const tenantId = body.tenantId || req.user?.tenantId;
    return this.usersService.create({ ...body, tenantId });
  }

  @Get()
  async findAll(@Query('tenantId') tenantId: string, @Query('depotId') depotId?: string) {
    return this.usersService.findAll(tenantId, depotId);
  }

  @Get('commerciaux')
  async findCommerciaux(@Query('tenantId') tenantId: string) {
    return this.usersService.findCommerciaux(tenantId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.updateStatus(id, body.isActive);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { nom?: string; prenom?: string; role?: RoleUser; depotId?: string }) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
