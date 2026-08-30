import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface ScopeContext {
  tenantId: string | null;
  depotId: string | null;
  role: string | null;
  // Ajoutés pour alimenter automatiquement le Journal Audit (requestId
  // pour corréler plusieurs lignes issues d'une même requête HTTP,
  // metier dérivé du préfixe d'URL) sans devoir modifier chaque appel
  // logEvent() des services métier — même mécanisme de fallback que
  // tenantId/depotId ci-dessous.
  requestId?: string | null;
  metier?: string | null;
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
        requestId: null,
        metier: null,
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

  /**
   * Retourne l'identifiant de requête courant (pour corrélation d'audit).
   */
  getRequestId(): string | null {
    return this.getScope().requestId ?? null;
  }

  /**
   * Retourne le métier courant, dérivé du préfixe d'URL.
   */
  getMetier(): string | null {
    return this.getScope().metier ?? null;
  }
}