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
import { DepotScopeService } from '../common/depot-scope.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { CreateReceptionDto } from './dto/create-reception.dto';
import { FournisseursService } from './fournisseurs.service';

@Controller('fournisseurs')
@Roles(
  RoleUser.PATRON,
  RoleUser.GERANT,
  RoleUser.MAGASINIER,
  RoleUser.COMPTABLE,
)
export class FournisseursController {
  constructor(
    private readonly service: FournisseursService,
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

  @Post()
  createFournisseur(@Body() dto: CreateFournisseurDto) {
    const { tenantId, depotId } = this.getScope();
    return this.service.createFournisseur(dto, tenantId, depotId);
  }

  @Get()
  findAll() {
    const { tenantId, depotId } = this.getScope();
    return this.service.findAllFournisseurs(tenantId, depotId);
  }

  @Get('stats')
  stats() {
    const { tenantId, depotId } = this.getScope();
    return this.service.statsFournisseurs(tenantId, depotId);
  }

  @Patch(':id')
  updateFournisseur(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFournisseurDto>,
  ) {
    const { tenantId, depotId } = this.getScope();
    return this.service.updateFournisseur(tenantId, depotId, id, dto);
  }

  @Delete(':id')
  deleteFournisseur(@Param('id') id: string) {
    const { tenantId, depotId } = this.getScope();
    return this.service.deleteFournisseur(tenantId, depotId, id);
  }

  @Post('receptions')
  createReception(@Body() dto: CreateReceptionDto) {
    const { tenantId, depotId } = this.getScope();
    return this.service.createReception(dto, tenantId, depotId);
  }

  @Get('receptions')
  findReceptions() {
    const { tenantId, depotId } = this.getScope();
    return this.service.findAllReceptions(tenantId, depotId);
  }
}
