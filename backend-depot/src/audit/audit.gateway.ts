import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL?.split(',').map((value) => value.trim()).filter(Boolean) ?? [
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class AuditGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AuditGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) throw new UnauthorizedException('Token temps réel manquant');

      const payload = await this.jwtService.verifyAsync<Record<string, any>>(token);
      if (!payload?.sub || !payload?.tenantId) {
        throw new UnauthorizedException('Identité temps réel invalide');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          id: String(payload.sub),
          tenantId: String(payload.tenantId),
        },
        select: {
          id: true,
          tenantId: true,
          role: true,
          actif: true,
        },
      });

      if (!user || !user.actif || user.role !== 'PATRON') {
        throw new UnauthorizedException('Accès au journal d’audit refusé');
      }

      client.data.userId = user.id;
      client.data.tenantId = user.tenantId;
      client.data.role = user.role;
      await client.join(`tenant_${user.tenantId}`);
    } catch (error) {
      this.logger.warn(
        `Socket audit refusée ${client.id}: ${error instanceof Error ? error.message : 'auth error'}`,
      );
      client.emit('audit:error', { code: 'UNAUTHORIZED' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Socket audit déconnectée ${client.id}`);
  }

  emitAuditUpdate(tenantId: string, payload: any): void {
    if (!this.server) return;
    this.server.to(`tenant_${tenantId}`).emit('audit_update', payload);
  }

  private extractToken(client: Socket): string | null {
    const authToken = this.readOptionalString(client.handshake.auth?.token);
    if (authToken) return authToken.replace(/^Bearer\s+/i, '');

    const authorization = this.readOptionalString(client.handshake.headers.authorization);
    return authorization?.replace(/^Bearer\s+/i, '') ?? null;
  }

  private readOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
