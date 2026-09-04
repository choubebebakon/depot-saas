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

  private getTenantId(req: any): string {
    const tenantId = req.user?.tenantId;
    if (typeof tenantId !== 'string' || !tenantId.trim()) {
      throw new BadRequestException('Accès refusé : tenantId manquant dans le token.');
    }
    return tenantId.trim();
  }

  private parseHours(value?: string): number {
    if (value === undefined || value.trim() === '') return 24;
    const hours = Number(value);
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      throw new BadRequestException('hours doit être un entier compris entre 1 et 168.');
    }
    return hours;
  }

  private parseLimit(value?: string): number {
    if (value === undefined || value.trim() === '') return 100;
    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new BadRequestException('limit doit être un entier compris entre 1 et 500.');
    }
    return limit;
  }

  private parseOptionalNumber(value: string | undefined, field: string): number | undefined {
    if (value === undefined || value.trim() === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${field} est invalide.`);
    }
    return parsed;
  }

  private parseOptionalDate(value: string | undefined, field: string): string | undefined {
    if (value === undefined || value.trim() === '') return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} est invalide.`);
    }
    return date.toISOString();
  }

  private parseOptionalText(value: string | undefined, field: string, maxLength = 200): string | undefined {
    if (value === undefined) return undefined;
    const text = value.trim();
    if (!text) return undefined;
    if (text.length > maxLength) {
      throw new BadRequestException(`${field} est trop long (maximum ${maxLength} caractères).`);
    }
    return text;
  }

  private buildFiltersFromQuery(query: any): AuditJournalFilters {
    const startDate = this.parseOptionalDate(query.startDate, 'startDate');
    const endDate = this.parseOptionalDate(query.endDate, 'endDate');
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('La date de début doit précéder la date de fin.');
    }

    return {
      depotId: this.parseOptionalText(query.depotId, 'depotId', 100),
      action: this.parseOptionalText(query.action, 'action', 100),
      severite: query.severite,
      resultat: query.resultat,
      metier: this.parseOptionalText(query.metier, 'metier', 100),
      startDate,
      endDate,
      search: this.parseOptionalText(query.search, 'search', 200),
      montantMin: this.parseOptionalNumber(query.montantMin, 'montantMin'),
      montantMax: this.parseOptionalNumber(query.montantMax, 'montantMax'),
    };
  }

  private validateEnum(value: unknown, allowed: readonly string[], field: string): void {
    if (value !== undefined && value !== null && !allowed.includes(String(value))) {
      throw new BadRequestException(`${field} est invalide.`);
    }
  }

  private buildJournalFilters(query: any): AuditJournalFilters {
    const filters = this.buildFiltersFromQuery(query);
    this.validateEnum(filters.severite, Object.values(AuditSeverite), 'severite');
    this.validateEnum(filters.resultat, Object.values(AuditResultat), 'resultat');
    if (filters.montantMin !== undefined && filters.montantMax !== undefined && filters.montantMin > filters.montantMax) {
      throw new BadRequestException('montantMin doit être inférieur ou égal à montantMax.');
    }
    return filters;
  }

  @Get('journal')
  getJournalPatron(
    @Req() req: any,
    @Query() query: any,
  ) {
    const filters = this.buildJournalFilters(query);
    return this.auditService.getJournalPatron(this.getTenantId(req), {
      ...filters,
      limit: this.parseLimit(query.limit),
    });
  }

  @Get('integrity')
  verifyIntegrity(@Req() req: any) {
    return this.auditService.verifyIntegrity(this.getTenantId(req));
  }

  @Get('anomalies')
  detectAnomalies(@Req() req: any, @Query('hours') hours?: string) {
    return this.auditService.detectUnusualActivity(this.getTenantId(req), this.parseHours(hours));
  }

  @Get('dashboard')
  getDashboard(@Req() req: any, @Query('hours') hours?: string) {
    return this.auditService.getDashboard(this.getTenantId(req), this.parseHours(hours));
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCSV(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const buffer = await this.auditService.exportJournalCSV(this.getTenantId(req), this.buildJournalFilters(query));
    const date = new Date().toISOString().slice(0, 10);
    res.set({ 'Content-Disposition': `attachment; filename="journal-audit-${date}.csv"` });
    return new StreamableFile(buffer);
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPDF(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const buffer = await this.auditService.exportJournalPDF(this.getTenantId(req), this.buildJournalFilters(query));
    const date = new Date().toISOString().slice(0, 10);
    res.set({ 'Content-Disposition': `attachment; filename="journal-audit-${date}.pdf"` });
    return new StreamableFile(buffer);
  }

  @Get('resume')
  getResume(@Req() req: any, @Query('from') from: string, @Query('to') to: string) {
    const fromDate = this.parseDate(from, 'from');
    const toDate = this.parseDate(to, 'to');
    if (fromDate > toDate) throw new BadRequestException('La date de début doit précéder la date de fin.');
    return this.auditService.getResume(this.getTenantId(req), fromDate, toDate);
  }

  private parseDate(value: string | undefined, field: string): Date {
    if (!value?.trim()) throw new BadRequestException(`${field} est obligatoire.`);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} est invalide.`);
    return date;
  }
}
