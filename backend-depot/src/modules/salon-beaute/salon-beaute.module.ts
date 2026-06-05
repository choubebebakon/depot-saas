import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { SalonBeauteController } from './salon-beaute.controller';
import { SalonBeauteService } from './salon-beaute.service';

@Module({
  imports: [PrismaModule],
  controllers: [SalonBeauteController],
  providers: [SalonBeauteService],
  exports: [SalonBeauteService],
})
export class SalonBeauteModule {}
