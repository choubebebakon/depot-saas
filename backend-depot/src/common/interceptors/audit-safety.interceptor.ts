import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma.service';

/**
 * Defense-in-depth for the Patron audit endpoints.
 * The controller already derives tenantId from req.user; this interceptor
 * validates every user-controlled filter before it reaches Prisma/export.
 */
@Injectable()
export class AuditSafetyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const path = String(req.originalUrl || req.path || '');
    if (!path.includes('/audit/')) return next.handle();

    if (!req.user?.tenantId || req.user?.role !== 'PATRON') {
      throw new ForbiddenException('Accès au journal d’audit refusé.');
    }

    const query = req.query ?? {};
    const tenantId = String(req.user.tenantId);

    if (query.depotId !== undefined && query.depotId !== null && String(query.depotId).trim()) {
      const depotId = String(query.depotId).trim();
      const depot = await this.prisma.depot.findFirst({
        where: { id: depotId, tenantId, isArchived: false },
        select: { id: true },
      });
      if (!depot) throw new ForbiddenException('Dépôt non autorisé pour ce tenant.');
      query.depotId = depot.id;
    } else {
      delete query.depotId;
    }

    const validateDate = (value: unknown, field: string): string | undefined => {
      if (value === undefined || value === null || String(value).trim() === '') return undefined;
      const raw = String(value).trim();
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`${field} est invalide.`);
      }
      return raw;
    };

    query.startDate = validateDate(query.startDate, 'startDate');
    query.endDate = validateDate(query.endDate, 'endDate');

    if (query.startDate && query.endDate) {
      if (new Date(query.startDate).getTime() > new Date(query.endDate).getTime()) {
        throw new BadRequestException('La date de début doit précéder la date de fin.');
      }
    }

    const validateNumber = (value: unknown, field: string): number | undefined => {
      if (value === undefined || value === null || String(value).trim() === '') return undefined;
      const number = Number(String(value).trim().replace(',', '.'));
      if (!Number.isFinite(number) || number < 0) {
        throw new BadRequestException(`${field} est invalide.`);
      }
      return number;
    };

    const montantMin = validateNumber(query.montantMin, 'montantMin');
    const montantMax = validateNumber(query.montantMax, 'montantMax');
    if (montantMin !== undefined && montantMax !== undefined && montantMin > montantMax) {
      throw new BadRequestException('montantMin doit être inférieur ou égal à montantMax.');
    }

    const limitRaw = query.limit === undefined ? 100 : Number(query.limit);
    if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > 500) {
      throw new BadRequestException('limit doit être un entier compris entre 1 et 500.');
    }
    query.limit = String(limitRaw);

    if (query.search !== undefined) {
      const search = String(query.search).trim();
      query.search = search.length > 120 ? search.slice(0, 120) : search;
    }

    if (query.action !== undefined) query.action = String(query.action).trim().slice(0, 100);
    if (query.metier !== undefined) query.metier = String(query.metier).trim().slice(0, 80);

    if (montantMin !== undefined) query.montantMin = String(montantMin);
    else delete query.montantMin;
    if (montantMax !== undefined) query.montantMax = String(montantMax);
    else delete query.montantMax;

    return next.handle();
  }
}
