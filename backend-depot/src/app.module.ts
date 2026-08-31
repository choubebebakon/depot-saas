import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { DepotScopeService } from './common/depot-scope.service';
import { ContextMiddleware } from './common/middleware/context.middleware';
import { DepotScopeInterceptor } from './common/interceptors/depot-scope.interceptor';
import { PromotionScopeInterceptor } from './common/interceptors/promotion-scope.interceptor';
import { TourneeScopeInterceptor } from './common/interceptors/tournee-scope.interceptor';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { DepotsModule } from './depots/depots.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionGuard } from './auth/guards/permission.guard';
import { AccessStatusGuard } from './common/guards/access-status.guard';
import { QuotaDepotGuard } from './common/guards/quota-depot.guard';

import { MaintenanceModule } from './maintenance/maintenance.module';
import { CommissionsModule } from './commissions/commissions.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { TasksModule } from './tasks/tasks.module';
import { ConsignesModule } from './consignes/consignes.module';
import { DepotBoissonsModule } from './modules/depot-boissons/depot-boissons.module';
import { ArticlesModule } from './articles/articles.module';
import { DlcModule } from './dlc/dlc.module';
import { StocksModule } from './stocks/stocks.module';
import { VentesModule } from './ventes/ventes.module';
import { ImpressionModule } from './impression/impression.module';
import { PaiementModule } from './paiement/paiement.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { AuditModule } from './audit/audit.module';
import { RapportsModule } from './rapports/rapports.module';
import { ClientsModule } from './clients/clients.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { CaisseModule } from './caisse/caisse.module';
import { TourneesModule } from './tournees/tournees.module';
import { CommandesModule } from './commandes/commandes.module';
import { LivraisonsModule } from './livraisons/livraisons.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { EmailModule } from './common/email/email.module';
import { BoutiqueModule } from './modules/boutique/boutique.module';
import { SupermarcheModule } from './modules/supermarche/supermarche.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { ExportsModule } from './exports/exports.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SupportModule } from './support/support.module';
import { BillingModule } from './billing/billing.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    TenantsModule,
    ConsignesModule,
    DepotsModule,
    DepotBoissonsModule,
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
    LivraisonsModule,
    AdminModule,
    PaymentsModule,
    TasksModule,
    BoutiqueModule,
    SupermarcheModule,
    ChatbotModule,
    OnboardingModule,
    EmailModule,
    NotificationsModule,
    ExportsModule,
    InvoicesModule,
    SupportModule,
    BillingModule,
    PlatformAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    DepotScopeService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AccessStatusGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_INTERCEPTOR, useClass: DepotScopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: PromotionScopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TourneeScopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes('*');
  }
}
