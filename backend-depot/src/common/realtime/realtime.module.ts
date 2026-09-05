import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DepotsModule } from '../../depots/depots.module';
import { PrismaService } from '../../prisma.service';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeMutationInterceptor } from './realtime-mutation.interceptor';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [AuthModule, DepotsModule],
  providers: [
    PrismaService,
    RealtimeGateway,
    RealtimeService,
    RealtimeMutationInterceptor,
  ],
  exports: [RealtimeService, RealtimeMutationInterceptor],
})
export class RealtimeModule {}
