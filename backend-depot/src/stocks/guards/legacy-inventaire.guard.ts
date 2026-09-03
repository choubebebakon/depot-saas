import { CanActivate, ExecutionContext, GoneException, Injectable } from '@nestjs/common';

/**
 * L'ancien endpoint supermarche/stock/inventaire effectuait des écritures
 * directes sans les garanties transactionnelles du nouveau service commun.
 * Il est volontairement désactivé pour éviter deux chemins d'écriture concurrents.
 */
@Injectable()
export class LegacyInventaireGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = String(request?.route?.path || request?.originalUrl || request?.url || '');

    if (request?.method === 'POST' && path.includes('/supermarche/stock/inventaire')) {
      throw new GoneException(
        'Cet endpoint d’inventaire a été remplacé par /stocks/inventaire.',
      );
    }

    return true;
  }
}
