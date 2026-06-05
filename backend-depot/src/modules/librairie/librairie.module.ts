import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { LibrairieController } from './librairie.controller';
import { LibrairieService } from './librairie.service';

@Module({
  imports: [PrismaModule],
  controllers: [LibrairieController],
  providers: [LibrairieService],
  exports: [LibrairieService],
})
export class LibrairieModule {}
