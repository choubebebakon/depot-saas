import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DepotScopeService } from '../depot-scope.service';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeMutationInterceptor } from './realtime-mutation.interceptor';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [AuthModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    RealtimeMutationInterceptor,
    DepotScopeService,
  ],
  exports: [RealtimeService, RealtimeMutationInterceptor],
})
export class RealtimeModule {}
