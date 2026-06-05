import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PromotionsService } from './boutique.service';

@Controller('boutique/promotions')
export class BoutiqueController {
  constructor(private promotionsService: PromotionsService) {}

  @Post()
  async create(@Body() data: any) {
    return this.promotionsService.create(data);
  }

  @Get()
  async findAll(@Body('tenantId') tenantId: string) {
    return this.promotionsService.findAll(tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }

  @Get('caisse')
  async getCaisse() {
    return { data: [], total: 0 };
  }
}
