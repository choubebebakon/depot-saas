import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { HotellerieController } from './hotellerie.controller';
import { HotellerieService } from './hotellerie.service';

@Module({
  imports: [PrismaModule],
  controllers: [HotellerieController],
  providers: [HotellerieService],
  exports: [HotellerieService],
})
export class HotellerieModule {}
