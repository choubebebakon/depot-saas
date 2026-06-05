import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { GlacierController } from './glacier.controller';
import { GlacierService } from './glacier.service';

@Module({
  imports: [PrismaModule],
  controllers: [GlacierController],
  providers: [GlacierService],
  exports: [GlacierService],
})
export class GlacierModule {}
