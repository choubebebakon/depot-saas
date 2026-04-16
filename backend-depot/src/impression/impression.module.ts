import { Module } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { ImpressionController } from './impression.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ImpressionController],
  providers: [ImpressionService, PrismaService],
  exports: [ImpressionService],
})
export class ImpressionModule {}
