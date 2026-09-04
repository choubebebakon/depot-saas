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
import { DepotsService } from '../../depots/depots.service';
import { PrismaService } from '../../prisma.service';
import { RealtimeEvent } from './realtime.service';

const TENANT_ROOM = (tenantId: string) => `tenant:${tenantId}`;
const DEPOT_ROOM = (tenantId: string, depotId: string) => `tenant:${tenantId}:depot:${depotId}`;
const MULTI_DEPOT_ROLES = new Set(['PATRON']);

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

  constructor(
    private readonly jwtService: JwtService,
    private readonly depotsService: DepotsService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) throw new UnauthorizedException('Token temps réel manquant');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (!payload?.sub || !payload?.tenantId) {
        throw new UnauthorizedException('Identité temps réel invalide');
      }

      // Le JWT sert à authentifier la session, mais la base reste l'autorité
      // pour le rôle, le tenant, le dépôt et l'état actif du compte.
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, tenantId: payload.tenantId },
        select: {
          id: true,
          email: true,
          role: true,
          tenantId: true,
          depotId: true,
          isActive: true,
          isSuperAdmin: true,
          tenant: { select: { estActif: true } },
        },
      });

      if (!user || !user.isActive || (!user.tenant.estActif && !user.isSuperAdmin)) {
        throw new UnauthorizedException('Session temps réel invalide ou compte indisponible');
      }

      const requestedDepotId = this.readOptionalString(socket.handshake.auth?.depotId);
      const depotId = user.isSuperAdmin ? null : await this.resolveAuthorizedDepot(user, requestedDepotId);

      socket.data.userId = user.id;
      socket.data.tenantId = user.tenantId;
      socket.data.depotId = depotId;
      socket.data.role = user.role;
      socket.data.email = user.email;
      socket.data.isSuperAdmin = user.isSuperAdmin;

      // Un utilisateur métier ne rejoint jamais le room tenant-wide.
      // Seul le PATRON peut recevoir les événements sans dépôt ciblé.
      if (user.role === 'PATRON') {
        await socket.join(TENANT_ROOM(user.tenantId));
      }
      if (user.isSuperAdmin) {
        await socket.join('platform:superadmin');
      }
      if (depotId) {
        await socket.join(DEPOT_ROOM(user.tenantId, depotId));
      }

      socket.emit('realtime:ready', {
        tenantId: user.tenantId,
        depotId,
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

    // Les événements tenant-wide sont réservés au PATRON.
    this.server.to(TENANT_ROOM(event.tenantId)).emit('realtime:event', envelope);
  }

  publishPlatform<T>(event: RealtimeEvent<T>): void {
    if (!this.server || !event?.type) return;
    this.server.to('platform:superadmin').emit('realtime:platform-event', {
      type: event.type,
      resource: event.resource,
      action: event.action,
      occurredAt: event.occurredAt,
      actorUserId: event.actorUserId,
      payload: event.payload ?? null,
    });
  }

  private async resolveAuthorizedDepot(
    user: { role: string; tenantId: string; depotId: string | null },
    requestedDepotId: string | null,
  ): Promise<string | null> {
    if (!MULTI_DEPOT_ROLES.has(user.role)) {
      if (!user.depotId) {
        if (requestedDepotId) throw new UnauthorizedException('Dépôt non autorisé');
        return null;
      }
      if (requestedDepotId && requestedDepotId !== user.depotId) {
        throw new UnauthorizedException('Dépôt non autorisé');
      }
      const depot = await this.depotsService.findOne(user.depotId, user.tenantId);
      if (!depot || depot.isArchived) throw new UnauthorizedException('Dépôt non autorisé');
      return depot.id;
    }

    if (!requestedDepotId) {
      if (!user.depotId) return null;
      const depot = await this.depotsService.findOne(user.depotId, user.tenantId);
      if (!depot || depot.isArchived) throw new UnauthorizedException('Dépôt non autorisé');
      return depot.id;
    }

    const depot = await this.depotsService.findOne(requestedDepotId, user.tenantId);
    if (!depot || depot.isArchived) {
      throw new UnauthorizedException('Dépôt non autorisé');
    }

    return depot.id;
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
