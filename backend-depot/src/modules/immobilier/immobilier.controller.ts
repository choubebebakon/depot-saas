import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Metier } from '../../auth/decorators/metier.decorator';
import { MetierGuard } from '../../common/guards/metier.guard';
import { MetierType } from '../../common/config/metier-roles.config';
import {
  ImmobilierService,
  CreateBienDto,
  CreateContratDto,
  CreatePaiementDto,
  CreateInterventionDto,
  PaginationDto,
} from './immobilier.service';

@Controller('immobilier')
@Metier(MetierType.IMMOBILIER)
@UseGuards(JwtAuthGuard, MetierGuard)
export class ImmobilierController {
  constructor(private readonly service: ImmobilierService) {}

  @Get('biens')
  async findAllBiens(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllBiens(req.user.tenantId, query);
  }

  @Post('biens')
  async createBien(@Req() req: any, @Body() dto: CreateBienDto) {
    return this.service.createBien(req.user.tenantId, dto);
  }

  @Get('contrats')
  async findAllContrats(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllContrats(req.user.tenantId, query);
  }

  @Post('contrats')
  async createContrat(@Req() req: any, @Body() dto: CreateContratDto) {
    return this.service.createContrat(req.user.tenantId, dto);
  }

  @Post('contrats/:id/statut')
  async updateContratStatut(
    @Param('id') id: string,
    @Body('statut') statut: string,
  ) {
    return this.service.updateContratStatut(id, statut);
  }

  @Get('paiements')
  async findAllPaiements(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllPaiements(req.user.tenantId, query);
  }

  @Post('paiements')
  async createPaiement(@Req() req: any, @Body() dto: CreatePaiementDto) {
    return this.service.createPaiement(req.user.tenantId, dto);
  }

  @Get('interventions')
  async findAllInterventions(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllInterventions(req.user.tenantId, query);
  }

  @Post('interventions')
  async createIntervention(
    @Req() req: any,
    @Body() dto: CreateInterventionDto,
  ) {
    return this.service.createIntervention(req.user.tenantId, dto);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 4 ---

  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Put('parametres')
  async updateParametres(@Body() body: Record<string, unknown>) {
    return body;
  }

  @Get('config')
  async getConfig() {
    return {};
  }

  @Get('caisse')
  async getCaisse() {
    return { solde: 0, totalEntrees: 0, totalSorties: 0 };
  }
}
