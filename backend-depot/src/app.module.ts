import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'; // 👈 MODIFIÉ : Ajout de APP_INTERCEPTOR
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

// Core & Common
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { DepotScopeService } from './common/depot-scope.service';
import { ContextMiddleware } from './common/middleware/context.middleware';
import { DepotScopeInterceptor } from './common/interceptors/depot-scope.interceptor'; // 👈 AJOUTÉ : Import de l'interceptor

// Modules de base & Auth
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { DepotsModule } from './depots/depots.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { SaasGuard } from './common/guards/saas.guard';
import { AccessStatusGuard } from './common/guards/access-status.guard';
import { QuotaDepotGuard } from './common/guards/quota-depot.guard';

// Vos autres imports de modules métiers (Conservés à l'identique)
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
import { CimentBtpModule } from './modules/ciment-btp/ciment-btp.module';
import { PressingModule } from './modules/pressing/pressing.module';
import { QuincaillerieModule } from './modules/quincaillerie/quincaillerie.module';
import { PharmacieModule } from './modules/pharmacie/pharmacie.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { TelephonieModule } from './modules/telephonie/telephonie.module';
import { ElevageModule } from './modules/elevage/elevage.module';
import { SalonBeauteModule } from './modules/salon-beaute/salon-beaute.module';
import { ParfumerieModule } from './modules/parfumerie/parfumerie.module';
import { BoulangerieModule } from './modules/boulangerie/boulangerie.module';
import { GlacierModule } from './modules/glacier/glacier.module';
import { LibrairieModule } from './modules/librairie/librairie.module';
import { CliniqueModule } from './modules/clinique/clinique.module';
import { TransportModule } from './modules/transport/transport.module';
import { ImmobilierModule } from './modules/immobilier/immobilier.module';
import { GarageModule } from './modules/garage/garage.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { HotellerieModule } from './modules/hotellerie/hotellerie.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { ExportsModule } from './exports/exports.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
    CimentBtpModule,
    PressingModule,
    QuincaillerieModule,
    PharmacieModule,
    RestaurantModule,
    TelephonieModule,
    ElevageModule,
    SalonBeauteModule,
    ParfumerieModule,
    BoulangerieModule,
    GlacierModule,
    LibrairieModule,
    CliniqueModule,
    TransportModule,
    ImmobilierModule,
    HotellerieModule,
    GarageModule,
    ChatbotModule,
    OnboardingModule,
    EmailModule,
    NotificationsModule,
    ExportsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    DepotScopeService,
    // 1. Le Throttler protège en premier lieu l'application entière
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 2. Le JwtAuthGuard décode et valide la session (génère request.user)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 3. Les Guards SaaS s'exécutent
    { provide: APP_GUARD, useClass: SaasGuard },
    { provide: APP_GUARD, useClass: AccessStatusGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    // 🔥 4. ENREGISTREMENT DE L'INTERCEPTOR GLOBAL SCOPE (ALS)
    // Placé dans les providers pour résoudre automatiquement le DepotScopeService.
    // NestJS l'exécutera juste après la validation réussie des Guards.
    {
      provide: APP_INTERCEPTOR,
      useClass: DepotScopeInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes('*');
  }
}
