import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_meta';

export interface AuditMeta {
  action: string;
  targetType: string;
}

/**
 * Instrumente une route pour qu'elle log automatiquement dans le journal
 * patron. Utilisation : @Audit(AUDIT_ACTIONS.SUPPRESSION_ARTICLE, 'Article')
 * au-dessus d'une méthode de controller, en combinant avec
 * @UseInterceptors(AuditInterceptor) sur le controller.
 *
 * Couvre les cas CRUD simples (suppression, validation, changement de
 * statut). Pour les flux qui ont besoin d'un diff avant/après précis
 * (annulation de vente, ajustement de stock...), continuer à appeler
 * AuditService.logEvent() manuellement dans le service, comme c'est déjà
 * fait dans ventes.service.ts et stocks.service.ts.
 */
export const Audit = (action: string, targetType: string) =>
  SetMetadata(AUDIT_KEY, { action, targetType } as AuditMeta);
