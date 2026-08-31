import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

export interface RealtimeEvent<T = unknown> {
  type: string;
  resource: string;
  action: 'created' | 'updated' | 'deleted' | 'changed';
  tenantId: string;
  depotId: string | null;
  actorUserId: string | null;
  occurredAt: string;
  payload?: T;
}

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  publish<T>(event: RealtimeEvent<T>): void {
    if (!event.tenantId) return;
    this.gateway.publish(event);
  }
}
