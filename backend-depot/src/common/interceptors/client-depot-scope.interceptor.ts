import {
  BadRequestException,
  Injectable,
  NestInterceptor,
  NotFoundException,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma.service';

/**
 * Defense-in-depth for the legacy beverage-depot client endpoints.
 *
 * The underlying service historically accepted tenantId for several client
 * operations and could therefore touch a client from another depot inside
 * the same tenant. This interceptor makes the active depot authoritative at
 * the HTTP boundary without changing the legacy service contract.
 */
@Injectable()
export class ClientDepotScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const method = String(req.method || '').toUpperCase();
    const path = String(req.route?.path || req.path || '');

    if (!path.includes('depot-boissons/clients')) {
      return next.handle();
    }

    const tenantId = req.depotScope?.tenantId || req.user?.tenantId;
    const depotId = req.depotScope?.depotId || req.headers?.['x-depot-id'];

    if (!tenantId || typeof tenantId !== 'string') {
      throw new BadRequestException('Contexte tenant invalide.');
    }
    if (!depotId || typeof depotId !== 'string') {
      throw new BadRequestException('Aucun dépôt actif sélectionné.');
    }

    const depot = await this.prisma.depot.findFirst({
      where: { id: depotId, tenantId, estActif: true },
      select: { id: true },
    });
    if (!depot) {
      throw new BadRequestException('Dépôt actif invalide pour ce tenant.');
    }

    // Never let a client-controlled depotId override the active depot.
    if (method === 'GET' && !req.params?.id) {
      req.query = { ...(req.query || {}), depotId };
      return next.handle();
    }

    if (method === 'POST' && !req.params?.id) {
      req.body = { ...(req.body || {}), depotId };
      delete req.body.tenantId;
      return next.handle();
    }

    const clientId = req.params?.id;
    if (!clientId) {
      return next.handle();
    }

    const client = await this.prisma.client.findFirst({
      where: { id: String(clientId), tenantId, depotId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client introuvable dans le dépôt actif.');
    }

    if (method === 'PATCH' || method === 'PUT') {
      req.body = { ...(req.body || {}) };
      delete req.body.depotId;
      delete req.body.tenantId;
    }

    if (path.includes('payer-dette')) {
      req.body = { ...(req.body || {}), depotId };
      delete req.body.tenantId;
    }

    if (path.includes('historique-achats')) {
      req.query = { ...(req.query || {}), depotId };
    }

    return next.handle();
  }
}
