import { Global, Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    PrismaService,
    DepotScopeService,
  ],
  exports: [
    PrismaService,
    DepotScopeService,
  ],
})
export class TenantsModule {}
