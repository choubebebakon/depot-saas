import { Controller, Get, GoneException, Param, Post } from '@nestjs/common';

/**
 * Ancien endpoint de livraison BTP.
 * Le flux de livraison fournisseur de GesTock passe désormais par
 * FournisseursController /fournisseurs/receptions, qui utilise le scope
 * tenant+dépôt autoritaire et l'idempotence des réceptions.
 */
@Controller('livraisons')
export class LivraisonsController {
  @Get(':id')
  findOne(@Param('id') _id: string): never {
    throw new GoneException('Ancien endpoint de livraison désactivé. Utilisez le module Achats/Réceptions.');
  }

  @Post(':id/confirmer')
  confirmer(@Param('id') _id: string): never {
    throw new GoneException('Ancien endpoint de livraison désactivé. Utilisez le module Achats/Réceptions.');
  }
}
