import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { GarageController } from './garage.controller';
import { GarageService } from './garage.service';

@Module({
  imports: [PrismaModule],
  controllers: [GarageController],
  providers: [GarageService],
  exports: [GarageService],
})
export class GarageModule {}
