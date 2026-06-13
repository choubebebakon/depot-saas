import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { DepotBoissonsController } from './depot-boissons.controller';
import { DepotBoissonsService } from './depot-boissons.service';
import { CaisseModule } from '../../caisse/caisse.module';

@Module({
  imports: [PrismaModule, CaisseModule],
  controllers: [DepotBoissonsController],
  providers: [DepotBoissonsService],
  exports: [DepotBoissonsService],
})
export class DepotBoissonsModule {}
