import { Module } from '@nestjs/common';
import { DepotsService } from './depots.service';
import { DepotsController } from './depots.controller';
import { MetierDepotsController } from './metier-depots.controller';
import { TransfertsService } from './transferts.service';
import { TransfertsController } from './transferts.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DepotsController, TransfertsController, MetierDepotsController],
  providers: [DepotsService, TransfertsService, PrismaService],
  exports: [DepotsService],
})
export class DepotsModule {}
