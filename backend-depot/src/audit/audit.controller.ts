import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { AuditSeverite, AuditResultat, RoleUser } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService, AuditJournalFilters } from './audit.service';

@Controller('audit')
@Roles(RoleUser.PATRON)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * SÉCURITÉ : le tenantId ne doit JAMAIS venir d'un paramètre fourni par
   * le client (query/body) — un PATRON authentifié pour le tenant A pourrait
   * sinon lire le journal d'audit du tenant B en changeant juste la query
   * string. La seule source de vérité est le token JWT décodé par
   * JwtAuthGuard, qui peuple req.user.
   */
  private getTenantId(req: any): string {
    if (!req.user?.tenantId) {
      throw new BadRequestException('Accès refusé : tenantId manquant dans le token.');
    }
    return req.user.tenantId;
  }

  private buildFiltersFromQuery(query: any): AuditJournalFilters {
    return {
      depotId: query.depotId,
      action: query.action,
      severite: query.severite,
      resultat: query.resultat,
      metier: query.metier,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
      montantMin: query.montantMin ? parseFloat(query.montantMin) : undefined,
      montantMax: query.montantMax ? parseFloat(query.montantMax) : undefined,
    };
  }

  @Get('journal')
  getJournalPatron(
    @Req() req: any,
    @Query('depotId') depotId?: string,
    @Query('action') action?: string,
    @Query('severite') severite?: AuditSeverite,
    @Query('resultat') resultat?: AuditResultat,
    @Query('metier') metier?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('montantMin') montantMin?: string,
    @Query('montantMax') montantMax?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getJournalPatron(this.getTenantId(req), {
      depotId,
      action,
      severite,
      resultat,
      metier,
      startDate,
      endDate,
      search,
      montantMin: montantMin ? parseFloat(montantMin) : undefined,
      montantMax: montantMax ? parseFloat(montantMax) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCSV(
    @Req() req: any,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.auditService.exportJournalCSV(
      this.getTenantId(req),
      this.buildFiltersFromQuery(query),
    );
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Disposition': `attachment; filename="journal-audit-${date}.csv"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPDF(
    @Req() req: any,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.auditService.exportJournalPDF(
      this.getTenantId(req),
      this.buildFiltersFromQuery(query),
    );
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Disposition': `attachment; filename="journal-audit-${date}.pdf"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('resume')
  getResume(
    @Req() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.auditService.getResume(this.getTenantId(req), new Date(from), new Date(to));
  }
}