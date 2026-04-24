import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

type DepotScopeState = {
  depotId: string | null;
};

@Injectable()
export class DepotScopeService {
  private readonly storage = new AsyncLocalStorage<DepotScopeState>();

  run<T>(state: DepotScopeState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  getDepotId(): string | null {
    return this.storage.getStore()?.depotId ?? null;
  }
}
