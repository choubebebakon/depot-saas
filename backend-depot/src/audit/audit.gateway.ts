import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuditGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId;
    if (tenantId) {
      client.join(`tenant_${tenantId}`);
      console.log(`Client ${client.id} joined room tenant_${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  emitAuditUpdate(tenantId: string, payload: any) {
    if (this.server) {
      this.server.to(`tenant_${tenantId}`).emit('audit_update', payload);
    }
  }
}
