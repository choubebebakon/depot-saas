import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
@Roles(RoleUser.PATRON, RoleUser.GERANT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body: { email: string; password: string; role: RoleUser; tenantId: string; nom?: string }) {
    return this.usersService.create(body);
  }

  @Get()
  async findAll(@Query('tenantId') tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  // Retourne uniquement les utilisateurs avec le rôle COMMERCIAL
  @Get('commerciaux')
  async findCommerciaux(@Query('tenantId') tenantId: string) {
    return this.usersService.findCommerciaux(tenantId);
  }
}
