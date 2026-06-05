import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma.module';
import { AppLoggerModule } from '../common/logger/logger.module';

/**
 * Module de facturation PDF pour GeStock.
 *
 * Fonctionnalites:
 * - Generation automatique de factures PDF apres paiement SUCCESS
 * - Contenu obligatoire conforme TVA Cameroun (19.25%)
 * - Stockage des references de factures
 * - Telechargement des factures par les clients
 *
 * Contenu obligatoire des factures:
 * → Nom et coordonnees de l'entreprise cliente (Tenant)
 * → Plan souscrit + cycle de facturation (Mensuel/Annuel)
 * → Montant HT | TVA 19.25% | Montant TTC (en XAF)
 * → Methode de paiement | ID Transaction | Date
 * → Periode couverte (du XX/XX/XXXX au XX/XX/XXXX)
 */
@Module({
  imports: [PrismaModule, AppLoggerModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
