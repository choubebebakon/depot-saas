import { ForbiddenException, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface ScopeContext {
  tenantId: string | null;
  depotId: string | null;
  role: string | null;
  requestId?: string | null;
  metier?: string | null;
}

const EMPTY_SCOPE: ScopeContext = {
  tenantId: null,
  depotId: null,
  role: null,
  requestId: null,
  metier: null,
};

@Injectable()
export class DepotScopeService {
  private readonly als = new AsyncLocalStorage<ScopeContext>();

  /**
   * Execute une requête dans un contexte tenant/dépôt authentifié.
   *
   * Cette classe ne fabrique jamais d'identité et ne fait aucune confiance aux
   * headers ou au localStorage. Le contexte doit être construit par un Guard /
   * interceptor après authentification.
   */
  run<T>(context: ScopeContext, next: () => T): T {
    return this.als.run(context, next);
  }

  /** Retourne le contexte courant, ou un contexte explicitement vide hors requête. */
  getScope(): ScopeContext {
    return this.als.getStore() ?? EMPTY_SCOPE;
  }

  getTenantId(): string | null {
    return this.getScope().tenantId;
  }

  getDepotId(): string | null {
    return this.getScope().depotId;
  }

  getRequestId(): string | null {
    return this.getScope().requestId ?? null;
  }

  getMetier(): string | null {
    return this.getScope().metier ?? null;
  }

  /**
   * Utiliser pour les opérations strictement tenant-scopées.
   * Fail-closed : absence de scope = refus, jamais fallback implicite.
   */
  requireTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant requis.');
    return tenantId;
  }

  /**
   * Utiliser pour les opérations strictement dépôt-scopées.
   */
  requireDepotId(): string {
    const depotId = this.getDepotId();
    if (!depotId) throw new ForbiddenException('Dépôt actif requis.');
    return depotId;
  }

  /**
   * Utiliser quand une opération exige simultanément tenant + dépôt.
   */
  requireScope(): { tenantId: string; depotId: string; role: string | null } {
    const scope = this.getScope();
    if (!scope.tenantId || !scope.depotId) {
      throw new ForbiddenException('Contexte tenant et dépôt requis.');
    }
    return {
      tenantId: scope.tenantId,
      depotId: scope.depotId,
      role: scope.role,
    };
  }
}
