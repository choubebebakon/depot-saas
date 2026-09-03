import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { StatutCommande } from '@prisma/client';
import { ACCESS_LEVELS } from '../common/utils/rbac';
import { Roles } from '../auth/decorators/roles.decorator';
import { DepotScopeService } from '../common/depot-scope.service';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';

@Controller('commandes')
export class CommandesController {
  constructor(
    private readonly commandesService: CommandesService,
    private readonly depotScope: DepotScopeService,
  ) {}

  private getScope(): { tenantId: string; depotId: string } {
    const tenantId = this.depotScope.getTenantId();
    const depotId = this.depotScope.getDepotId();
    if (!tenantId || !depotId) {
      throw new Error('Contexte tenant/dépôt introuvable.');
    }
    return { tenantId, depotId };
  }

  @Get('suggestions')
  @Roles(...ACCESS_LEVELS.GERANT)
  getSuggestions() {
    const { tenantId, depotId } = this.getScope();
    return this.commandesService.genererSuggestions(tenantId, depotId);
  }

  @Post()
  @Roles(...ACCESS_LEVELS.GERANT)
  create(@Body() dto: CreateCommandeDto, @Request() req: any) {
    const { tenantId, depotId } = this.getScope();
    return this.commandesService.createCommande(dto, {
      ...req.user,
      tenantId,
      depotId,
    });
  }

  @Get()
  @Roles(...ACCESS_LEVELS.GERANT)
  findAll() {
    const { tenantId, depotId } = this.getScope();
    return this.commandesService.findAll(tenantId, depotId);
  }

  @Get(':id')
  @Roles(...ACCESS_LEVELS.GERANT)
  findOne(@Param('id') id: string) {
    const { tenantId, depotId } = this.getScope();
    return this.commandesService.findOne(id, tenantId, depotId);
  }

  @Patch(':id/statut')
  @Roles(...ACCESS_LEVELS.ADMIN)
  updateStatut(
    @Param('id') id: string,
    @Body('statut') statut: StatutCommande,
  ) {
    const { tenantId, depotId } = this.getScope();
    return this.commandesService.updateStatut(id, statut, tenantId, depotId);
  }

  @Put(':id')
  @Roles(...ACCESS_LEVELS.GERANT)
  update(@Param('id') id: string, @Body() dto: UpdateCommandeDto) {
    const { tenantId, depotId } = this.getScope();
    return this.commandesService.update(tenantId, depotId, id, dto);
  }
}
