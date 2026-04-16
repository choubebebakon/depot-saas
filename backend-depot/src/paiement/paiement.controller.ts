import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('paiements')
export class PaiementController {
  private readonly logger = new Logger(PaiementController.name);

  constructor(private readonly paiementService: PaiementService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    // Exemple attendu : { status: 'SUCCESS', tenantId: '...', amount: 20000, operateur: 'OM', transactionId: 'TXN123' }

    if (payload.status === 'SUCCESS' && payload.tenantId) {
      
      const montant = parseInt(payload.amount);
      const operateur = payload.operateur || 'INCONNU';
      const transactionId = payload.transactionId || `AUTO-${Date.now()}`;

      // Validation rapide du format de l'opérateur local pour les logs
      if (operateur !== 'OM' && operateur !== 'MOMO') {
        this.logger.warn(`Opérateur inhabituel détecté via webhook: ${operateur}`);
      }

      // Validation du montant avant de solliciter la DB
      if (montant !== 20000 && montant !== 150000) {
        this.logger.error(`Montant inattendu reçu : ${montant} pour le tenant ${payload.tenantId}`);
        // Différent des prix du SaaS, on renvoie à l'opérateur que c'est traité (pour stopper les retries) 
        // mais on n'ajoute pas de mois actif.
        return { received: true, status: 'IGNORED_INVALID_AMOUNT' };
      }

      try {
        await this.paiementService.traiterPaiement({
          tenantId: payload.tenantId,
          montant: montant,
          operateur: operateur,
          transactionId: transactionId
        });
      } catch (error) {
        this.logger.error(`Echec de renouvellement pour le tenant ${payload.tenantId}`, error.stack);
      }

      return { received: true, status: 'PROCESSED' };
    }

    // Le webhook n'était pas SUCCESS ou est incomplet
    return { received: true, status: 'IGNORED_OR_FAILED' };
  }
}
