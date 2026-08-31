import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CaisseService } from './caisse.service';
import {
  CreateDepenseDto,
  FermerCaisseDto,
  OuvrirCaisseDto,
} from './dto/caisse.dto';

@Controller('caisse')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMPTABLE)
export class CaisseController {
  constructor(private readonly caisseService: CaisseService) {}

  private getTenantId(req: any): string {
    if (!req.depotScope?.tenantId || req.depotScope.tenantId !== req.user?.tenantId) {
      throw new BadRequestException('Contexte tenant invalide.');
    }
    return req.depotScope.tenantId;
  }

  private getDepotId(req: any): string {
    const depotId = req.depotScope?.depotId;
    if (!depotId) {
      throw new BadRequestException('Aucun dépôt actif sélectionné.');
    }
    return depotId;
  }

  @Post('ouvrir')
  ouvrirSession(@Req() req: any, @Body() dto: OuvrirCaisseDto) {
    return this.caisseService.ouvrirSession({
      ...dto,
      tenantId: this.getTenantId(req),
      depotId: this.getDepotId(req),
      userId: req.user.id,
    });
  }

  @Post('fermer')
  fermerSession(@Req() req: any, @Body() dto: FermerCaisseDto) {
    return this.caisseService.fermerSession({
      ...dto,
      tenantId: this.getTenantId(req),
      depotId: this.getDepotId(req),
    });
  }

  @Get('session-active')
  getSessionActive(@Req() req: any, @Query('depotId') _depotId?: string) {
    return this.caisseService.getSessionActive(
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Get('historique')
  getHistorique(@Req() req: any, @Query('depotId') _depotId?: string) {
    return this.caisseService.getHistorique(
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Get('resume')
  getResume(@Req() req: any, @Query('depotId') _depotId?: string) {
    return this.caisseService.getResume(
      this.getTenantId(req),
      this.getDepotId(req),
    );
  }

  @Post('depenses')
  createDepense(@Req() req: any, @Body() dto: CreateDepenseDto) {
    return this.caisseService.createDepense({
      ...dto,
      tenantId: this.getTenantId(req),
      depotId: this.getDepotId(req),
    });
  }

  @Get('depenses')
  getDepenses(
    @Req() req: any,
    @Query('depotId') _depotId: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.caisseService.getDepenses(
      this.getTenantId(req),
      this.getDepotId(req),
      dateDebut,
      dateFin,
    );
  }
}
