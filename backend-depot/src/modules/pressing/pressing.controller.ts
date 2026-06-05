import { Controller, Post, Get, Put, Body, Query, UseGuards, Req, Patch, Param } from '@nestjs/common';
import { PressingService, PaginationDto } from './pressing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import { CreateTicketPressingDto, UpdateTicketStatutDto } from './dto/pressing.dto';

@Controller('pressing')
@Metier(MetierType.PRESSING)
@UseGuards(JwtAuthGuard, MetierGuard)
export class PressingController {
  constructor(private service: PressingService) {}

  @Get('tickets')
  async findAll(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllTickets(req.user.tenantId, query);
  }

  @Post('tickets')
  async create(@Req() req: any, @Body() data: CreateTicketPressingDto) {
    return this.service.createTicket(req.user.tenantId, data);
  }

  @Get('tickets/:id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.getTicketDetail(id, req.user.tenantId);
  }

  @Patch('tickets/:id/statut')
  async updateStatut(@Req() req: any, @Param('id') id: string, @Body() data: UpdateTicketStatutDto) {
    return this.service.updateTicketStatut(id, req.user.tenantId, data);
  }

  @Get('tickets/client/:id')
  async findByClient(@Req() req: any, @Param('id') id: string) {
    return this.service.getTicketsByClient(id, req.user.tenantId);
  }

  @Get('tickets/prets')
  async findPrets(@Req() req: any) {
    return this.service.getTicketsPrets(req.user.tenantId);
  }

  @Patch('tickets/:id/retrait')
  async marquerCommeRetire(@Req() req: any, @Param('id') id: string) {
    return this.service.marquerCommeRetire(id, req.user.tenantId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
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
}
