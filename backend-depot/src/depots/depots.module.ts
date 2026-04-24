import { Module } from '@nestjs/common';
import { DepotsService } from './depots.service';
import { DepotsController } from './depots.controller';
import { TransfertsService } from './transferts.service';
import { TransfertsController } from './transferts.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DepotsController, TransfertsController],
  providers: [DepotsService, TransfertsService, PrismaService],
})
export class DepotsModule { }
