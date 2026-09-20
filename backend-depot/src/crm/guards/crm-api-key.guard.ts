import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { CrmApiKeyService, type ResolvedCrmKey } from '../crm-api-key.service';
import { crmErrors } from '../crm-errors';
import { CrmLogger } from '../crm-logger.service';

/** Requête enrichie par le guard : contexte machine-à-machine authentifié. */
export interface CrmAuthenticatedRequest extends Request {
  crmKey?: ResolvedCrmKey;
  crmRequestId?: string;
}

/** Récupère le contexte, ou refuse si le guard n'a pas pu l'établir. */
export function requireCrmKey(
  request: CrmAuthenticatedRequest,
): ResolvedCrmKey {
  if (!request.crmKey) {
    throw crmErrors.internal(
      'Contexte CRM absent : la requête a contourné le guard d’authentification.',
    );
  }
  return request.crmKey;
}

/**
 * Authentification machine-à-machine des routes CRM.
 *
 * Ordre volontaire des vérifications (du moins coûteux au plus coûteux) :
 *  1. Authenticité de l'appelant si une signature Meta est présente/exigée ;
 *  2. résolution de `x-api-key` → tenantId (source de vérité unique) ;
 *  3. cohérence du `shopId` du body avec ce tenant (403 sinon).
 */
@Injectable()
export class CrmApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeys: CrmApiKeyService,
    private readonly logger: CrmLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<CrmAuthenticatedRequest>();
    const requestId = this.logger.resolveRequestId(request);
    request.crmRequestId = requestId;

    this.apiKeys.assertMetaSignature(request, requestId);

    const key = await this.apiKeys.resolve(request, requestId);

    this.assertShopIdMatches(request, key.tenantId, requestId);

    request.crmKey = key;
    return true;
  }

  /**
   * Isolation multi-tenant : le `shopId` envoyé dans le body n'est JAMAIS
   * utilisé pour filtrer. Il doit correspondre exactement au tenant résolu
   * depuis la clé d'API, sinon la requête est rejetée en 403. Sans ce contrôle,
   * une clé correctement émise pour un commerçant pourrait lire les fiches d'un
   * autre en fournissant un shopId différent.
   */
  private assertShopIdMatches(
    request: CrmAuthenticatedRequest,
    tenantId: string,
    requestId: string,
  ): void {
    const body: unknown = request.body;

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return;
    }

    const declared = (body as Record<string, unknown>).shopId;

    if (declared === undefined || declared === null || declared === '') {
      return;
    }

    if (typeof declared !== 'string') {
      throw crmErrors.tenantMismatch('shopId invalide.');
    }

    if (declared.trim() !== tenantId) {
      // Le shopId déclaré est journalisé sous forme d'empreinte : c'est un
      // identifiant de tenant, il n'a pas à apparaître en clair dans les logs.
      this.logger.warn('crm_shop_id_mismatch', {
        requestId,
        tenantId,
        declaredRef: this.logger.subjectRef(declared.trim()),
      });
      throw crmErrors.tenantMismatch(
        "shopId incohérent avec la clé d'API utilisée.",
      );
    }
  }
}