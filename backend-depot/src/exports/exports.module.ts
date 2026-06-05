import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { PrismaModule } from '../prisma.module';

/**
 * Module d'export de données pour le downgrade de plan.
 *
 * Fonctionnalites:
 * - Export CSV des depots excédentaires avant downgrade
 * - Export PDF des donnees d'archive
 * - Generation de rapports de transition
 *
 * Regles d'archivage:
 * → Données jamais supprimées physiquement
 * → isArchived: false systématiquement filtré dans les requêtes actives
 * → INDEX @@index([tenantId, isArchived]) pour ne pas dégrader les perfs
 * → Restauration possible si le client reprend un plan supérieur
 * → Conservation minimale : 6 mois après expiration du compte
 */
@Module({
  imports: [PrismaModule],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
