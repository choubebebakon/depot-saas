import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';

@Controller('telephonie')
@Metier(MetierType.TELEPHONIE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class TelephonieController {
  
  // --- Stubs Phase 2 ---
  @Get('config')
  async getConfig() {
    return {};
  }

  @Put('config')
  async updateConfig(@Body() body: any) {
    return body;
  }
}
