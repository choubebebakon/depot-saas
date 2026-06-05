import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { TelephonesService } from './telephones.service';
import { ReparationsService } from './reparations.service';
import { TelephonieController } from './telephonie.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TelephonieController],
  providers: [TelephonesService, ReparationsService],
  exports: [TelephonesService, ReparationsService],
})
export class TelephonieModule {}
