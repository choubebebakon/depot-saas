import { Module } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { PaiementController } from './paiement.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PaiementController],
  providers: [PaiementService, PrismaService],
  exports: [PaiementService]
})
export class PaiementModule {}
