import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Ferme les anciennes routes de dépenses qui acceptaient un depotId fourni
 * directement par le client. Le flux de production passe par
 * /boutique/depenses-production et son service de scope autoritaire.
 */
@Injectable()
export class LegacyBoutiqueDepensesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = String(request.path || '');
    const isLegacyExpenseRoute = path === '/boutique/depenses' || path.startsWith('/boutique/depenses/');
    if (isLegacyExpenseRoute) {
      throw new ForbiddenException('Ancien flux de dépenses désactivé. Utilisez le module Dépenses de production.');
    }
    return true;
  }
}
