import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface ScopeContext {
  tenantId: string | null;
  depotId: string | null;
  role: string | null;
}

@Injectable()
export class DepotScopeService {
  private readonly als = new AsyncLocalStorage<ScopeContext>();

  /**
   * Execute une requete dans un contexte tenant/depot isole.
   */
  run<T>(context: ScopeContext, next: () => T): T {
    return this.als.run(context, next);
  }

  /**
   * Retourne le contexte courant ou un contexte vide pour les routes publiques.
   */
  getScope(): ScopeContext {
    return this.als.getStore() ?? { tenantId: null, depotId: null, role: null };
  }

  /**
   * Retourne le tenant courant du contexte de requete.
   */
  getTenantId(): string | null {
    return this.getScope().tenantId;
  }

  /**
   * Retourne le depot courant du contexte de requete.
   */
  getDepotId(): string | null {
    return this.getScope().depotId;
  }
}
