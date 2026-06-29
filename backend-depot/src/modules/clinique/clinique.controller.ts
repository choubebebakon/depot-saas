import {
  Controller,
  Post,
  Get,
  Patch,
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
  CliniqueService,
  CreateDossierDto,
  CreateConsultationDto,
  CreatePrescriptionDto,
  CreateRdvDto,
  PaginationDto,
} from './clinique.service';

@Controller('clinique')
@Metier(MetierType.CLINIQUE)
@UseGuards(JwtAuthGuard, MetierGuard)
export class CliniqueController {
  constructor(private readonly service: CliniqueService) {}

  @Get('dossiers')
  async findAllDossiers(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllDossiers(req.user.tenantId, query);
  }

  @Post('dossiers')
  async createDossier(@Req() req: any, @Body() dto: CreateDossierDto) {
    return this.service.createDossier(req.user.tenantId, dto);
  }

  @Get('dossiers/:id')
  async getDossier(@Param('id') id: string) {
    return this.service.getDossier(id);
  }

  @Get('consultations')
  async findAllConsultations(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllConsultations(req.user.tenantId, query);
  }

  @Post('consultations')
  async createConsultation(
    @Req() req: any,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.service.createConsultation(req.user.tenantId, dto);
  }

  @Post('consultations/:id/prescriptions')
  async addPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.service.addPrescription(id, dto);
  }

  @Get('rendez-vous')
  async findAllRdvs(@Req() req: any, @Query() query: PaginationDto) {
    return this.service.findAllRdvs(req.user.tenantId, query);
  }

  @Post('rendez-vous')
  async createRdv(@Req() req: any, @Body() dto: CreateRdvDto) {
    return this.service.createRdv(req.user.tenantId, dto);
  }

  @Post('rendez-vous/:id/statut')
  async updateRdvStatut(
    @Param('id') id: string,
    @Body('statut') statut: string,
  ) {
    return this.service.updateRdvStatut(id, statut);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  // --- Stubs Phase 2 ---
  @Get('config')
  async getConfig() {
    return {};
  }

  @Patch('config')
  async updateConfig(@Body() body: any) {
    return body;
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

  @Get('caisse')
  async getCaisse() {
    return { solde: 0, totalEntrees: 0, totalSorties: 0 };
  }
}
