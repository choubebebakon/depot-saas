import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('restaurant')
@Metier(MetierType.RESTAURANT)
@UseGuards(JwtAuthGuard, MetierGuard)
export class RestaurantController {
  
  // --- Stubs Phase 2 ---
  @Get('commandes')
  async getCommandes() {
    return { data: [], total: 0 };
  }

  @Get('config')
  async getConfig() {
    return {};
  }

  @Put('config')
  async updateConfig(@Body() body: any) {
    return body;
  }
}
