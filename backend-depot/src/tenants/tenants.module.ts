import { Module, Global } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service'; // Vérifie bien ce chemin

@Global()
@Module({
  controllers: [TenantsController],
  providers: [
    TenantsService,
    PrismaService,
    DepotScopeService // On l'ajoute ici
  ],
  exports: [
    PrismaService,
    DepotScopeService // INDISPENSABLE pour que Prisma puisse l'utiliser
  ],
})
export class TenantsModule { }