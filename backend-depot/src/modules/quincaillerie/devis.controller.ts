import { Controller, Post, Get, Body } from '@nestjs/common';
import { DevisService } from './devis.service';

@Controller('quincaillerie/devis')
export class DevisController {
  constructor(private devisService: DevisService) {}

  @Post()
  async create(@Body() data: any) {
    return this.devisService.create(data);
  }

  @Get()
  async findAll(@Body('tenantId') tenantId: string) {
    return this.devisService.findAll(tenantId);
  }
}
