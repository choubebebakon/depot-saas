import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Controleur d'export de données.
 *
 * Routes disponibles:
 * - POST /api/v1/exports/downgrade/:newPlan : Genere le rapport de downgrade
 * - GET /api/v1/exports/downgrade/:reportId/csv : Telecharge le CSV
 * - GET /api/v1/exports/downgrade/:reportId/pdf : Telecharge le PDF
 */
@ApiTags('Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  /**
   * Genere un rapport de downgrade pour le tenant courant.
   * Detecte les depots excédentaires et propose ceux a conserver.
   *
   * @param user - Utilisateur authentifie
   * @param newPlan - Nouveau plan cible
   * @returns Rapport de transition avec liste des depots
   */
  @Post('downgrade/:newPlan')
  @ApiOperation({ summary: 'Generer rapport de downgrade' })
  @ApiResponse({ status: 200, description: 'Rapport genere' })
  @ApiResponse({ status: 404, description: 'Tenant introuvable' })
  async generateDowngradeReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('newPlan') newPlan: string,
  ): Promise<ReturnType<ExportsService['generateDowngradeReport']>> {
    return this.exportsService.generateDowngradeReport(user.tenantId, newPlan);
  }

  /**
   * Telecharge le rapport de downgrade au format CSV.
   *
   * @param user - Utilisateur authentifie
   * @param newPlan - Nouveau plan cible
   * @param res - Reponse Express
   */
  @Get('downgrade/:newPlan/csv')
  @ApiOperation({ summary: 'Telecharger rapport CSV de downgrade' })
  @ApiResponse({ status: 200, description: 'Fichier CSV telechargeable' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="depots-a-archiver.csv"')
  async downloadDowngradeCSV(
    @CurrentUser() user: AuthenticatedUser,
    @Param('newPlan') newPlan: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const report = await this.exportsService.generateDowngradeReport(
      user.tenantId,
      newPlan,
    );

    const csvBuffer = this.exportsService.generateDepotsCSV(report);

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${report.tenantName}-depots-a-archiver-${newPlan}.csv"`,
    });

    return new StreamableFile(csvBuffer);
  }

  /**
   * Telecharge le rapport de downgrade au format PDF.
   *
   * @param user - Utilisateur authentifie
   * @param newPlan - Nouveau plan cible
   * @param res - Reponse Express
   */
  @Get('downgrade/:newPlan/pdf')
  @ApiOperation({ summary: 'Telecharger rapport PDF de downgrade' })
  @ApiResponse({ status: 200, description: 'Fichier PDF telechargeable' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="confirmation-downgrade.pdf"')
  async downloadDowngradePDF(
    @CurrentUser() user: AuthenticatedUser,
    @Param('newPlan') newPlan: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const report = await this.exportsService.generateDowngradeReport(
      user.tenantId,
      newPlan,
    );

    const pdfBuffer = await this.exportsService.generateDowngradePDF(report);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${report.tenantName}-confirmation-downgrade-${newPlan}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
