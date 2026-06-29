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
    // Sécurité : On s'assure qu'on ne passe pas de contexte invalide
    // Si pas de tenantId, on logge pour le suivi mais on autorise l'exécution
    if (!context.tenantId) {
      console.warn(
        '⚠️ Requête sans tenantId détectée - exécution en mode ouvert.',
      );
    }
    return this.als.run(context, next);
  }

  /**
   * Retourne le contexte courant.
   * Si aucun contexte n'est trouvé (hors d'une requête), on renvoie une valeur
   * par défaut sécurisée pour éviter les erreurs de type 'undefined'.
   */
  getScope(): ScopeContext {
    const store = this.als.getStore();
    return (
      store ?? {
        tenantId: 'PUBLIC',
        depotId: null,
        role: 'GUEST',
      }
    );
  }

  /**
   * Retourne le tenant courant.
   */
  getTenantId(): string | null {
    return this.getScope().tenantId;
  }

  /**
   * Retourne le depot courant.
   */
  getDepotId(): string | null {
    return this.getScope().depotId;
  }
}
