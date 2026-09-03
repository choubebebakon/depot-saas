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
 * Early validation for client-credit mutations.
 * Database triggers remain the final concurrency-safe invariant; this layer
 * turns the common invalid cases into useful API errors before the mutation.
 */
@Injectable()
export class ClientCreditSafetyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const method = String(req.method || '').toUpperCase();
    const path = String(req.originalUrl || req.path || req.route?.path || '');

    const isDebtPayment = method === 'POST' && path.includes('/depot-boissons/clients/') && path.includes('/payer-dette');
    const isSale = method === 'POST' && (path === '/ventes' || path.endsWith('/ventes') || path.includes('/ventes?'));

    if (!isDebtPayment && !isSale) {
      return next.handle();
    }

    const tenantId = req.depotScope?.tenantId || req.user?.tenantId;
    const depotId = req.depotScope?.depotId || req.headers?.['x-depot-id'];
    if (!tenantId || !depotId) {
      throw new BadRequestException('Contexte tenant/dépôt invalide.');
    }

    if (isDebtPayment) {
      const clientId = String(req.params?.id || '').trim();
      const montant = Number(String(req.body?.montant ?? '').trim().replace(',', '.'));
      if (!clientId) throw new BadRequestException('clientId est requis.');
      if (!Number.isFinite(montant) || montant <= 0) {
        throw new BadRequestException('Le montant du paiement doit être supérieur à 0.');
      }

      const client = await this.prisma.client.findFirst({
        where: { id: clientId, tenantId, depotId },
        select: { id: true, soldeCredit: true },
      });
      if (!client) throw new NotFoundException('Client introuvable dans le dépôt actif.');
      if (montant > client.soldeCredit + 0.01) {
        throw new BadRequestException('Le paiement dépasse la dette restante.');
      }

      req.body = { ...(req.body || {}), depotId };
      return next.handle();
    }

    const body = req.body || {};
    const credit = Number(body.montantCredit ?? (body.modePaiement === 'CREDIT' ? body.total ?? body.montantTotal : 0));
    if (!Number.isFinite(credit) || credit < 0) {
      throw new BadRequestException('Montant de crédit invalide.');
    }
    if (credit <= 0 || !body.clientId) {
      return next.handle();
    }

    const client = await this.prisma.client.findFirst({
      where: { id: String(body.clientId), tenantId, depotId },
      select: { id: true, soldeCredit: true, plafondCredit: true },
    });
    if (!client) {
      throw new BadRequestException('Client introuvable dans le dépôt actif.');
    }

    if (client.plafondCredit > 0 && client.soldeCredit + credit > client.plafondCredit + 0.01) {
      const disponible = Math.max(0, client.plafondCredit - client.soldeCredit);
      throw new BadRequestException(
        `Plafond de crédit dépassé. Crédit disponible : ${disponible.toFixed(2)} FCFA.`,
      );
    }

    return next.handle();
  }
}
