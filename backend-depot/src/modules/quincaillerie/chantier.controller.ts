import { Controller, Post, Get, Body } from '@nestjs/common';
import { ChantierService } from './chantier.service';

@Controller('quincaillerie/chantiers')
export class ChantierController {
  constructor(private chantierService: ChantierService) {}

  @Post()
  async create(@Body() data: any) {
    return this.chantierService.create(data);
  }

  @Get()
  async findAll(@Body('tenantId') tenantId: string) {
    return this.chantierService.findAll(tenantId);
  }
}
