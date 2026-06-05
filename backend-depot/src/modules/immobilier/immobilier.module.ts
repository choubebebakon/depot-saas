import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { ImmobilierController } from './immobilier.controller';
import { ImmobilierService } from './immobilier.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImmobilierController],
  providers: [ImmobilierService],
  exports: [ImmobilierService],
})
export class ImmobilierModule {}
