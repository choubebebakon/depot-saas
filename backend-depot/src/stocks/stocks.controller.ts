import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { StocksService } from './stocks.service';
import { SignalerAvarieDto } from './dto/signaler-avarie.dto';
import { ACCESS_LEVELS } from '../common/utils/rbac';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) { }

  @Get()
  @Roles(...ACCESS_LEVELS.GERANT)
  async getStocks(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string
  ) {
    return this.stocksService.obtenirTousLesStocks(tenantId, depotId);
  }

  @Get('stats')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getStats(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string
  ) {
    return this.stocksService.obtenirStats(tenantId, depotId);
  }

  @Get('alertes')
  @Roles(...ACCESS_LEVELS.GERANT)
  async getAlertes(
    @Query('tenantId') tenantId: string,
    @Query('depotId') depotId: string
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
    @Body() data: {
      articleId: string;
      depotId: string;
      nouvelleQuantite: number;
      tenantId: string;
      motif?: string;
    }
  ) {
    return this.stocksService.ajusterStock({ ...data, actor: req.user });
  }

  @Post('transferer')
  @Roles(...ACCESS_LEVELS.GERANT)
  async transferer(
    @Body() data: {
      articleId: string;
      sourceDepotId: string;
      destDepotId: string;
      quantite: number;
      tenantId: string;
      motif?: string;
    }
  ) {
    return this.stocksService.transfererStock(data);
  }

  @Post('avarie')
  @Roles(...ACCESS_LEVELS.GERANT)
  async signalerAvarie(@Request() req: any, @Body() data: SignalerAvarieDto) {
    return this.stocksService.signalerAvarie(data, req.user);
  }
}
