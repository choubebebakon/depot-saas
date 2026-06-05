import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { ParfumerieController } from './parfumerie.controller';
import { ParfumerieService } from './parfumerie.service';

@Module({
  imports: [PrismaModule],
  controllers: [ParfumerieController],
  providers: [ParfumerieService],
  exports: [ParfumerieService],
})
export class ParfumerieModule {}
