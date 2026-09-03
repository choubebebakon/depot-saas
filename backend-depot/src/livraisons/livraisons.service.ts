import { GoneException, Injectable } from '@nestjs/common';

/**
 * Service conservé uniquement pour compatibilité avec d'anciens imports.
 *
 * Le flux historique LivraisonBTP est désactivé. Les réceptions fournisseur
 * sont désormais traitées exclusivement par FournisseursService, avec scope
 * tenant+dépôt autoritaire et idempotence.
 *
 * IMPORTANT : aucune opération de lecture ou d'écriture n'est conservée ici,
 * afin qu'un ancien appel interne ne puisse contourner les contrôles du flux
 * moderne.
 */
@Injectable()
export class LivraisonsService {
  private disabled(): never {
    throw new GoneException(
      'Le service historique de livraison est désactivé. Utilisez le module Achats/Réceptions.',
    );
  }

  findOne(_id: string, _tenantId?: string, _depotId?: string): never {
    return this.disabled();
  }

  confirmer(_id: string, _tenantId?: string, _depotId?: string, _user?: unknown): never {
    return this.disabled();
  }
}
