import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { StocksService } from './stocks.service';

@Controller('stocks')
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.MAGASINIER)
export class StocksController {
  constructor(private readonly stocksService: StocksService) { }

  @Post('ajuster')
  async ajuster(
    @Body() data: {
      articleId: string;
      siteId: string;
      quantite: number;
      tenantId: string;
      motif?: string
    }
  ) {
    return this.stocksService.ajusterStock(data);
  }

  @Get('mouvements/:tenantId')
  async voirMouvements(@Param('tenantId') tenantId: string) {
    return this.stocksService.obtenirMouvements(tenantId);
  }

  @Post('transferer')
  async transferer(
    @Body() data: {
      articleId: string;
      sourceSiteId: string;
      destinationSiteId: string;
      quantite: number;
      tenantId: string;
      motif?: string
    }
  ) {
    return this.stocksService.transfererStock(data);
  }
}
