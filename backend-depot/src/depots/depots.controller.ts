import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DepotsService } from './depots.service';
import { CreateDepotDto } from './dto/create-depot.dto';
import { UpdateDepotDto } from './dto/update-depot.dto';

@Controller('depots')
export class DepotsController {
  constructor(private readonly depotsService: DepotsService) { }

  @Get()
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER, RoleUser.COMPTABLE)
  findAll(@Query('tenantId') tenantId: string) {
    return this.depotsService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER, RoleUser.COMPTABLE)
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.depotsService.findOne(id, tenantId);
  }

  @Post()
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  create(@Body() createDepotDto: CreateDepotDto) {
    return this.depotsService.create(createDepotDto);
  }

  @Patch(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  update(@Param('id') id: string, @Query('tenantId') tenantId: string, @Body() updateDepotDto: UpdateDepotDto) {
    return this.depotsService.update(id, tenantId, updateDepotDto);
  }

  @Delete(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.depotsService.remove(id, tenantId);
  }
}

