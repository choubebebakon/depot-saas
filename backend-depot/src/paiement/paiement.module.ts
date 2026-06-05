// src/paiement/paiement.module.ts
import { Module } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { PaiementController } from './paiement.controller';
import { PrismaService } from '../prisma.service';

// 1. Importe le module parent/cousin qui contient le vrai PaymentsService
import { PaymentsModule } from '../payments/payments.module'; // 👈 Ajuste le chemin si nécessaire

@Module({
  imports: [
    PaymentsModule // 👈 2. On l'injecte ici pour donner accès à son PaymentsService
  ],
  controllers: [PaiementController],
  providers: [PaiementService, PrismaService],
  exports: [PaiementService]
})
export class PaiementModule {}