import { MaintenanceModule } from './maintenance/maintenance.module';
import { CommissionsModule } from './commissions/commissions.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { DepotScopeService } from './common/depot-scope.service';
import { SaasGuard } from './common/guards/saas.guard';
import { TenantsModule } from './tenants/tenants.module';
import { ConsignesModule } from './consignes/consignes.module';
import { DepotsModule } from './depots/depots.module';
import { ArticlesModule } from './articles/articles.module';
import { DlcModule } from './dlc/dlc.module';
import { StocksModule } from './stocks/stocks.module';
import { VentesModule } from './ventes/ventes.module';
import { ImpressionModule } from './impression/impression.module';
import { UsersModule } from './users/users.module';
import { PaiementModule } from './paiement/paiement.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { AuditModule } from './audit/audit.module';
import { RapportsModule } from './rapports/rapports.module';
import { ClientsModule } from './clients/clients.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { CaisseModule } from './caisse/caisse.module';
import { TourneesModule } from './tournees/tournees.module';
import { CommandesModule } from './commandes/commandes.module';

@Module({
  imports: [
    AuthModule,
    TenantsModule,
    ConsignesModule,
    DepotsModule,
    MaintenanceModule,
    CommissionsModule,
    ArticlesModule,
    DlcModule,
    StocksModule,
    VentesModule,
    ImpressionModule,
    UsersModule,
    PaiementModule,
    CatalogueModule,
    AuditModule,
    RapportsModule,
    ClientsModule,
    FournisseursModule,
    CaisseModule,
    TourneesModule,
    CommandesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    DepotScopeService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: SaasGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
