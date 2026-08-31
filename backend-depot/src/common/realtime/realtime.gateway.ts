import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { RealtimeEvent } from './realtime.service';

const TENANT_ROOM = (tenantId: string) => `tenant:${tenantId}`;
const DEPOT_ROOM = (tenantId: string, depotId: string) => `tenant:${tenantId}:depot:${depotId}`;

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',').map((value) => value.trim()).filter(Boolean) ?? [
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) throw new UnauthorizedException('Token temps réel manquant');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (!payload?.sub || !payload?.tenantId) {
        throw new UnauthorizedException('Identité temps réel invalide');
      }

      const requestedDepotId = this.readOptionalString(socket.handshake.auth?.depotId);
      if (requestedDepotId && payload.depotId !== requestedDepotId) {
        throw new UnauthorizedException('Dépôt non autorisé');
      }

      socket.data.userId = payload.sub;
      socket.data.tenantId = payload.tenantId;
      socket.data.depotId = payload.depotId ?? null;
      socket.data.role = payload.role;

      await socket.join(TENANT_ROOM(payload.tenantId));
      if (payload.depotId) {
        await socket.join(DEPOT_ROOM(payload.tenantId, payload.depotId));
      }

      socket.emit('realtime:ready', {
        tenantId: payload.tenantId,
        depotId: payload.depotId ?? null,
      });
    } catch (error) {
      this.logger.warn(`Socket refusée ${socket.id}: ${error instanceof Error ? error.message : 'auth error'}`);
      socket.emit('realtime:error', { code: 'UNAUTHORIZED' });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    this.logger.debug(`Socket déconnectée ${socket.id}`);
  }

  publish<T>(event: RealtimeEvent<T>): void {
    const envelope = {
      ...event,
      payload: event.payload ?? null,
    };

    if (event.depotId) {
      this.server.to(DEPOT_ROOM(event.tenantId, event.depotId)).emit('realtime:event', envelope);
      return;
    }

    this.server.to(TENANT_ROOM(event.tenantId)).emit('realtime:event', envelope);
  }

  private extractToken(socket: Socket): string | null {
    const authToken = this.readOptionalString(socket.handshake.auth?.token);
    if (authToken) return authToken.replace(/^Bearer\s+/i, '');

    const authorization = this.readOptionalString(socket.handshake.headers.authorization);
    return authorization?.replace(/^Bearer\s+/i, '') ?? null;
  }

  private readOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
