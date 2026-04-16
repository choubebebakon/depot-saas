import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatutAbonnement, PlanAbonnement } from '@prisma/client';

@Injectable()
export class PaiementService {
  private readonly logger = new Logger(PaiementService.name);

  constructor(private prisma: PrismaService) {}

  async traiterPaiement(data: { tenantId: string, montant: number, operateur: string, transactionId: string }) {
    const { tenantId, montant, operateur, transactionId } = data;

    // 1. Détermination du plan et des mois en fonction du montant strict de 20 000 ou 150 000 FCFA
    let moisAmount = 0;
    let planAttribue: PlanAbonnement | null = null;

    if (montant === 20000) {
      moisAmount = 1;
      planAttribue = PlanAbonnement.MENSUEL;
    } else if (montant === 150000) {
      moisAmount = 12;
      planAttribue = PlanAbonnement.ANNUEL;
    } else {
      throw new BadRequestException(`Montant invalide: ${montant} FCFA. Seuls les montants de 20000 (Mensuel) et 150000 (Annuel) sont acceptés.`);
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant introuvable pour ce paiement.');
    }

    // Utilisation d'une transaction pour la cohérence des données Paiement + Souscription
    return await this.prisma.$transaction(async (tx) => {
      // 2. Création du registre de transaction / facture de la plateforme
      const transactionRecord = await tx.paiementSouscription.create({
        data: {
          tenantId: tenantId,
          montant: montant,
          reference: transactionId, 
          statut: 'SUCCESS',
        }
      });

      // 3. Calculer la nouvelle date d'expiration
      const now = new Date();
      const currentDateExp = (tenant.dateExpiration && tenant.dateExpiration > now) 
                             ? tenant.dateExpiration 
                             : now;
                             
      const nouvelleExpiration = new Date(currentDateExp);
      nouvelleExpiration.setMonth(nouvelleExpiration.getMonth() + moisAmount);

      // 4. Mettre à jour le statut du Tenant et le plan actif
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          statutAbonnement: StatutAbonnement.ACTIVE,
          dateExpiration: nouvelleExpiration,
          plan: planAttribue,
        }
      });

      // 5. Journalisation Console du succès
      this.logger.log(`[PAIEMENT REÇU] - Opérateur: ${operateur} - Montant: ${montant} - Tenant: ${tenantId} - Réf: ${transactionId}`);

      return {
        message: 'Abonnement prolongé avec succès',
        nouvelleExpiration,
        paiementId: transactionRecord.id,
      };
    });
  }
}
