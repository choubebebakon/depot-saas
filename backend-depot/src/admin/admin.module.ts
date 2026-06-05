import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma.module';
import { PaymentsModule } from '../payments/payments.module';

/**
 * Module Admin Interne pour GeStock.
 * Acces restreint au proprietaire uniquement.
 *
 * Fonctionnalites:
 * - Tableau de bord des transactions (PENDING / SUCCESS / FAILED)
 * - Filtre par methode: MTN_MOMO | VISA_CARD | MASTERCARD
 * - Reconciliation manuelle par transaction
 * - Liste des tenants par statut (ACTIVE | GRACE_PERIOD | EXPIRED)
 * - Alertes visuelles transactions bloquees
 */
@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
