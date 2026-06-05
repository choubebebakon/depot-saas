import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { BoulangerieController } from './boulangerie.controller';
import { BoulangerieService } from './boulangerie.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoulangerieController],
  providers: [BoulangerieService],
  exports: [BoulangerieService],
})
export class BoulangerieModule {}
