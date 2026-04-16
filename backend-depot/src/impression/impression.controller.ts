import { Controller, Get, Param, Query } from '@nestjs/common';
import { RoleUser } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ImpressionService } from './impression.service';

@Controller()
@Roles(RoleUser.PATRON, RoleUser.GERANT, RoleUser.CAISSIER, RoleUser.COMMERCIAL, RoleUser.MAGASINIER)
export class ImpressionController {
  constructor(private readonly impressionService: ImpressionService) {}

  @Get('ventes/:id/ticket')
  async getTicket(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ) {
    return this.impressionService.genererTicketVente(id, tenantId);
  }
}
