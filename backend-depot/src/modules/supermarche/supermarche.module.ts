import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { SupermarcheController } from './supermarche.controller';
import { SupermarcheService } from './supermarche.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupermarcheController],
  providers: [SupermarcheService],
  exports: [SupermarcheService],
})
export class SupermarcheModule {}
