import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DepotsService } from './depots.service';
import { CreateDepotDto } from './dto/create-depot.dto';
import { UpdateDepotDto } from './dto/update-depot.dto';

@Controller('depots')
export class DepotsController {
  constructor(private readonly depotsService: DepotsService) {}

  @Get()
  @Roles(
    RoleUser.PATRON,
    RoleUser.GERANT,
    RoleUser.CAISSIER,
    RoleUser.COMMERCIAL,
    RoleUser.MAGASINIER,
    RoleUser.COMPTABLE,
  )
  findAll(@CurrentUser() user: any) {
    return this.depotsService.findAll(user);
  }

  @Get(':id')
  @Roles(
    RoleUser.PATRON,
    RoleUser.GERANT,
    RoleUser.CAISSIER,
    RoleUser.COMMERCIAL,
    RoleUser.MAGASINIER,
    RoleUser.COMPTABLE,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.depotsService.findOne(id, user);
  }

  @Post()
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  create(@Body() createDepotDto: CreateDepotDto, @CurrentUser() user: any) {
    return this.depotsService.create(createDepotDto, user);
  }

  @Patch(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  update(
    @Param('id') id: string,
    @Body() updateDepotDto: UpdateDepotDto,
    @CurrentUser() user: any,
  ) {
    return this.depotsService.update(id, updateDepotDto, user);
  }

  @Delete(':id')
  @Roles(RoleUser.PATRON, RoleUser.GERANT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.depotsService.remove(id, user);
  }
}
