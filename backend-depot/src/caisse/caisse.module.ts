import { Module } from '@nestjs/common';
import { CaisseService } from './caisse.service';
import { CaisseController } from './caisse.controller';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';

@Module({
  controllers: [CaisseController],
  providers: [CaisseService, PrismaService, DepotScopeService],
  exports: [CaisseService],
})
export class CaisseModule {}
