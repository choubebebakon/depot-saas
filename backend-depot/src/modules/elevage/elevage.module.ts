import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { ElevageController } from './elevage.controller';
import { ElevageService } from './elevage.service';

@Module({
  imports: [PrismaModule],
  controllers: [ElevageController],
  providers: [ElevageService],
  exports: [ElevageService],
})
export class ElevageModule {}
