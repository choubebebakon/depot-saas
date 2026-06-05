import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { DepotBoissonsController } from './depot-boissons.controller';
import { DepotBoissonsService } from './depot-boissons.service';

@Module({
  imports: [PrismaModule],
  controllers: [DepotBoissonsController],
  providers: [DepotBoissonsService],
  exports: [DepotBoissonsService],
})
export class DepotBoissonsModule {}
