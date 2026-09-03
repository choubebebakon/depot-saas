import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { InventaireService } from './inventaire.service';
import { RealiserInventaireDto } from './dto/realiser-inventaire.dto';

@Controller('stocks/inventaire')
export class InventaireController {
  constructor(private readonly inventaireService: InventaireService) {}

  private tenantId(req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Contexte tenant manquant.');
    }
    return tenantId;
  }

  private depotId(req: any, headerDepotId?: string) {
    const requested = headerDepotId?.trim();
    const actorDepot = req.user?.depotId?.trim();

    if (req.user?.role !== 'PATRON') {
      if (!actorDepot) {
        throw new BadRequestException('Aucun dépôt n’est associé à cet utilisateur.');
      }
      if (requested && requested !== actorDepot) {
        throw new BadRequestException('Le dépôt demandé ne correspond pas à votre dépôt autorisé.');
      }
      return actorDepot;
    }

    return requested || actorDepot;
  }

  @Get()
  @RequirePermission('inventaire', 'read')
  async getInventaire(
    @Req() req: any,
    @Headers('x-depot-id') headerDepotId?: string,
    @Query('search') search?: string,
  ) {
    return this.inventaireService.getInventaire(
      this.tenantId(req),
      this.depotId(req, headerDepotId),
      search,
    );
  }

  @Post()
  @RequirePermission('inventaire', 'write')
  async realiserInventaire(
    @Req() req: any,
    @Headers('x-depot-id') headerDepotId: string | undefined,
    @Body() dto: RealiserInventaireDto,
  ) {
    return this.inventaireService.realiserInventaire(
      this.tenantId(req),
      this.depotId(req, headerDepotId),
      dto,
      req.user,
    );
  }
}
