import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { DepotBoissonsController } from './depot-boissons.controller';
import { DepotBoissonsService } from './depot-boissons.service';
import { DepotBoissonsMediaService } from './depot-boissons-media.service';
import { CaisseModule } from '../../caisse/caisse.module';

@Module({
  imports: [PrismaModule, CaisseModule],
  controllers: [DepotBoissonsController],
  providers: [
    {
      provide: DepotBoissonsService,
      useClass: DepotBoissonsMediaService,
    },
  ],
  exports: [DepotBoissonsService],
})
export class DepotBoissonsModule {}
