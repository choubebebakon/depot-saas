import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { StocksService } from './stocks.service';
import { SignalerAvarieDto } from './dto/signaler-avarie.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ACCESS_LEVELS } from '../common/utils/rbac';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @Roles(...ACCESS_LEVELS.GERANT)
  async getStocks(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.stocksService.obtenirTousLesStocks(tenantId, depotId);
  }

  @Get('stats')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getStats(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.stocksService.obtenirStats(tenantId, depotId);
  }

  @Get('alertes')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getAlertes(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.stocksService.obtenirAlertes(tenantId, depotId);
  }

  @Get('mouvements')
  @Roles(...ACCESS_LEVELS.GERANT)
  async voirMouvements(@Query() query: any) {
    return this.stocksService.obtenirMouvements(query.tenantId, query);
  }

  @Post('ajuster')
  @Roles(...ACCESS_LEVELS.GERANT)
  async ajuster(
    @Request() req: any,
    @Body()
    data: {
      articleId: string;
      depotId: string;
      nouvelleQuantite: number;
      tenantId: string;
      motif?: string;
    },
  ) {
    return this.stocksService.ajusterStock({ ...data, actor: req.user });
  }

  @Post('transferer')
  @Roles(...ACCESS_LEVELS.GERANT)
  async transferer(
    @Body()
    data: {
      articleId: string;
      sourceDepotId: string;
      destDepotId: string;
      quantite: number;
      tenantId: string;
      motif?: string;
    },
  ) {
    return this.stocksService.transfererStock(data);
  }

  @Post('avarie')
  @Roles(...ACCESS_LEVELS.GERANT)
  async signalerAvarie(@Request() req: any, @Body() data: SignalerAvarieDto) {
    return this.stocksService.signalerAvarie(data, req.user);
  }

  @Get('config')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getConfig(@Query('tenantId') tenantId: string) {
    return this.stocksService.getConfig(tenantId);
  }

  @Get('caisse')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getCaisse(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.stocksService.getCaisse(tenantId, depotId);
  }

  @Get(':id')
  @Roles(...ACCESS_LEVELS.GERANT)
  async findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.stocksService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles(...ACCESS_LEVELS.GERANT)
  async update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stocksService.update(tenantId, id, dto);
  }

  // === GESTION DES LOTS ===

  @Get('lots')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getLots(
    @Query('tenantId') tenantId: string,
    @Query('articleId') articleId: string,
    @Query('depotId') depotId: string,
  ) {
    return this.stocksService.getLots(tenantId, articleId, depotId);
  }

  @Get('lots/:id')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getLotById(
    @Param('id') lotId: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.stocksService.getLotById(tenantId, lotId);
  }

  @Post('lots')
  @Roles(...ACCESS_LEVELS.GERANT)
  async createLot(
    @Request() req: any,
    @Body()
    data: {
      articleId: string;
      depotId: string;
      tenantId: string;
      quantite: number;
      dlc?: Date;
      numeroLot?: string;
    },
  ) {
    return this.stocksService.createLot({ ...data, actor: req.user });
  }

  @Put('lots/:id')
  @Roles(...ACCESS_LEVELS.GERANT)
  async updateLot(
    @Param('id') lotId: string,
    @Query('tenantId') tenantId: string,
    @Body()
    data: {
      quantite?: number;
      dlc?: Date;
      numeroLot?: string;
    },
  ) {
    return this.stocksService.updateLot(tenantId, lotId, data);
  }

  @Delete('lots/:id')
  @Roles(...ACCESS_LEVELS.GERANT)
  async deleteLot(
    @Param('id') lotId: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.stocksService.deleteLot(tenantId, lotId);
  }

  @Get('lots/alertes-dlc')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getDLCAlertes(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string,
    @Query('jours') jours?: string,
  ) {
    return this.stocksService.getDLCAlertes(tenantId, depotId, jours ? parseInt(jours) : 30);
  }
}
