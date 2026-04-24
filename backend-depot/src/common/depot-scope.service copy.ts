import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class DepotScopeService {
    private depotId: string | null = null;

    setDepotId(id: string) {
        this.depotId = id;
    }

    getDepotId(): string | null {
        return this.depotId;
    }
}