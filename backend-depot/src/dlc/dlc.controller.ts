import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DlcService } from './dlc.service';

@Controller('dlc')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
export class DlcController {
  constructor(private readonly dlcService: DlcService) {}

  private getTenantId(req: any): string {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('tenantId manquant (non authentifié)');
    return tenantId;
  }

  @Post('lots')
  creerLot(
    @Req() req: any,
    @Body()
    body: {
      articleId: string;
      depotId: string;
      quantite: number;
      dlc?: string;
      numeroLot?: string;
    },
  ) {
    const tenantId = this.getTenantId(req);
    return this.dlcService.creerLot({
      ...body,
      tenantId,
      dlc: body.dlc ? new Date(body.dlc) : undefined,
    });
  }

  @Get('lots')
  findLots(
    @Req() req: any,
    @Query('depotId') depotId: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.dlcService.findLots(tenantId, depotId);
  }

  @Get('alertes')
  getAlertes(
    @Req() req: any,
    @Query('depotId') depotId: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.dlcService.getAlertes(tenantId, depotId);
  }

  @Get('stats')
  getStats(
    @Req() req: any,
    @Query('depotId') depotId: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.dlcService.getStats(tenantId, depotId);
  }

  @Put('lots/:id')
  updateLot(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { dlc?: string; numeroLot?: string; quantite?: number },
  ) {
    const tenantId = this.getTenantId(req);
    return this.dlcService.updateLot(id, tenantId, {
      dlc: body.dlc ? new Date(body.dlc) : undefined,
      numeroLot: body.numeroLot,
    });
  }

  @Delete('lots/:id')
  deleteLot(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = this.getTenantId(req);
    return this.dlcService.deleteLot(id, tenantId);
  }
}
