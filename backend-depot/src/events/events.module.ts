import { Module } from '@nestjs/common';
import { VenteGateway } from './vente.gateway';

@Module({
  providers: [VenteGateway],
  exports: [VenteGateway],
})
export class EventsModule {}
