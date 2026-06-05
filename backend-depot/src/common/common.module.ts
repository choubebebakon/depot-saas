import { Global, Module } from '@nestjs/common';
import { DepotScopeService } from './depot-scope.service';

@Global()
@Module({
  providers: [DepotScopeService],
  exports: [DepotScopeService],
})
export class CommonModule {}
