import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface ScopeContext {
  tenantId: string | null;
  depotId: string | null;
  role: string | null;
  requestId?: string | null;
  metier?: string | null;
}

@Injectable()
export class DepotScopeService {
  private readonly als = new AsyncLocalStorage<ScopeContext>();

  /**
   * Execute une requête dans un contexte tenant/dépôt isolé.
   */
  run<T>(context: ScopeContext, next: () => T): T {
    if (!context.tenantId) {
      console.warn(
        '⚠️ Requête sans tenantId détectée - aucun scope tenant ne sera appliqué.',
      );
    }
    return this.als.run(context, next);
  }

  /**
   * Retourne le contexte courant.
   * Hors d'une requête HTTP authentifiée, le contexte reste explicitement
   * anonyme. On n'utilise jamais une valeur fictive comme "PUBLIC" : une
   * valeur sentinelle pourrait être confondue avec un véritable tenant.
   */
  getScope(): ScopeContext {
    return (
      this.als.getStore() ?? {
        tenantId: null,
        depotId: null,
        role: null,
        requestId: null,
        metier: null,
      }
    );
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
}
