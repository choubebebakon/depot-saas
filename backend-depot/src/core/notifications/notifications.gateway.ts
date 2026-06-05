import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  [key: string]: unknown;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly tenantConnections = new Map<string, Set<string>>();
  private readonly maxConnectionsPerTenant = 100;

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        this.logger.warn(`Connexion refusée : pas de token (${client.id})`);
        client.emit('error', { message: 'Authentification requise' });
        client.disconnect();
        return;
      }

      const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        this.logger.error('JWT_SECRET non défini');
        client.disconnect();
        return;
      }

      const decoded = jwt.verify(token as string, secret) as JwtPayload;
      const tenantId = decoded.tenantId;
      const userId = decoded.sub;

      if (!tenantId || !userId) {
        client.disconnect();
        return;
      }

      const tenantCount = this.tenantConnections.get(tenantId)?.size || 0;
      if (tenantCount >= this.maxConnectionsPerTenant) {
        this.logger.warn(`Limite atteinte pour tenant ${tenantId}`);
        client.emit('error', { message: 'Limite de connexions atteinte' });
        client.disconnect();
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

      this.logger.log(`Client connecté: ${client.id} | tenant: ${tenantId} | user: ${userId}`);
    } catch (err) {
      this.logger.warn(`Connexion rejetée (token invalide): ${client.id}`);
      client.emit('error', { message: 'Token invalide' });
      client.disconnect();
    }
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
