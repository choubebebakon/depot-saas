import { Controller, Get, Post, Body, Param, Query, Patch, Request } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { StatutCommande } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ACCESS_LEVELS } from '../common/utils/rbac';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Get('suggestions')
  @Roles(...ACCESS_LEVELS.GERANT)
  getSuggestions(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.commandesService.genererSuggestions(tenantId, depotId);
  }

  @Post()
  @Roles(...ACCESS_LEVELS.GERANT)
  create(@Body() dto: CreateCommandeDto, @Request() req: any) {
    return this.commandesService.createCommande(dto, req.user);
  }

  @Get()
  @Roles(...ACCESS_LEVELS.GERANT)
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.commandesService.findAll(tenantId, depotId);
  }

  @Get(':id')
  @Roles(...ACCESS_LEVELS.GERANT)
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.commandesService.findOne(id, tenantId, depotId);
  }

  @Patch(':id/statut')
  @Roles(...ACCESS_LEVELS.ADMIN)
  updateStatut(
    @Param('id') id: string,
    @Body('statut') statut: StatutCommande,
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.commandesService.updateStatut(id, statut, tenantId, depotId);
  }
}
