import { Module } from '@nestjs/common';
import { LivraisonsController } from './livraisons.controller';
import { LivraisonsService } from './livraisons.service';

@Module({
  controllers: [LivraisonsController],
  providers: [LivraisonsService],
  exports: [LivraisonsService],
})
export class LivraisonsModule {}
