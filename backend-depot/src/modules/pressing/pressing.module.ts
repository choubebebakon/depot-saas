import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { PressingController } from './pressing.controller';
import { PressingService } from './pressing.service';

@Module({
  imports: [PrismaModule],
  controllers: [PressingController],
  providers: [PressingService],
  exports: [PressingService],
})
export class PressingModule {}
