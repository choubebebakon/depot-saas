import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Public()
  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  // On a supprimé update et remove pour l'instant pour nettoyer les erreurs
}
