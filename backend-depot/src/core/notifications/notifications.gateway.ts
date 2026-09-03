import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  [key: string]: unknown;
}

function getAllowedOrigins(): string[] | string {
  const configured = process.env.FRONTEND_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) return configured;
  return process.env.NODE_ENV === 'production' ? [] : '*';
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly tenantConnections = new Map<string, Set<string>>();
  private readonly maxConnectionsPerTenant = Number.parseInt(
    process.env.NOTIFICATION_WS_MAX_CONNECTIONS_PER_TENANT || '100',
    10,
  );

  handleConnection(client: Socket): void {
    try {
      // Le JWT est accepté uniquement via Socket.IO auth pour éviter son exposition
      // dans les URLs, les historiques et certains logs/proxies.
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || !token.trim()) {
        this.reject(client, 'Authentification requise');
        return;
      }

      const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        this.logger.error('JWT_SECRET non défini');
        this.reject(client, 'Service d’authentification indisponible');
        return;
      }

      const decoded = jwt.verify(token, secret) as JwtPayload;
      const tenantId = decoded.tenantId;
      const userId = decoded.sub;

      if (!tenantId || !userId) {
        this.reject(client, 'Token invalide');
        return;
      }

      const currentLimit =
        Number.isFinite(this.maxConnectionsPerTenant) && this.maxConnectionsPerTenant > 0
          ? this.maxConnectionsPerTenant
          : 100;
      const tenantCount = this.tenantConnections.get(tenantId)?.size || 0;
      if (tenantCount >= currentLimit) {
        this.logger.warn(`Limite atteinte pour tenant ${tenantId}`);
        this.reject(client, 'Limite de connexions atteinte');
        return;
      }

      if (!this.tenantConnections.has(tenantId)) {
        this.tenantConnections.set(tenantId, new Set());
      }
      this.tenantConnections.get(tenantId)!.add(client.id);

      client.data.tenantId = tenantId;
      client.data.userId = userId;
      client.data.role = decoded.role;

      client.join(`tenant:${tenantId}`);
      client.join(`user:${userId}`);

      this.logger.log(
        `Client connecté: ${client.id} | tenant: ${tenantId} | user: ${userId}`,
      );
    } catch {
      this.logger.warn(`Connexion rejetée (token invalide): ${client.id}`);
      this.reject(client, 'Token invalide');
    }
  }

  private reject(client: Socket, message: string): void {
    client.emit('error', { message });
    client.disconnect(true);
  }

  handleDisconnect(client: Socket): void {
    const tenantId = client.data?.tenantId;
    if (tenantId) {
      this.tenantConnections.get(tenantId)?.delete(client.id);
      if (this.tenantConnections.get(tenantId)?.size === 0) {
        this.tenantConnections.delete(tenantId);
      }
    }
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToTenant(tenantId: string, event: string, data: unknown): void {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitCritical(tenantId: string, data: unknown): void {
    this.server.to(`tenant:${tenantId}`).emit('notification:critical', data);
  }
}
