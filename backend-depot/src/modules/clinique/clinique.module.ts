import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { CliniqueController } from './clinique.controller';
import { CliniqueService } from './clinique.service';

@Module({
  imports: [PrismaModule],
  controllers: [CliniqueController],
  providers: [CliniqueService],
  exports: [CliniqueService],
})
export class CliniqueModule {}
