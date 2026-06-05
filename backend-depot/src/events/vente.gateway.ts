import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // En production, configurer correctement l'origine
  },
})
export class VenteGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('VenteGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  @SubscribeMessage('join_alerts')
  handleJoinAlerts(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string; role: string },
  ) {
    if (payload.tenantId && payload.role) {
      const room = `${payload.tenantId}_${payload.role}`;
      client.join(room);
      this.logger.log(`Client ${client.id} a rejoint la room: ${room}`);
    }
  }

  // Méthode appelée par le VentesService lors d'une nouvelle vente EN_ATTENTE
  emitNouvelleVente(tenantId: string, vente: any) {
    const room = `${tenantId}_MAGASINIER`;
    this.logger.log(`Émission nouvelle_vente vers la room: ${room}`);
    this.server.to(room).emit('nouvelle_vente', vente);
  }

  // Méthode appelée par le VentesService lors de la validation d'une vente
  emitVentePriseEnCharge(tenantId: string, venteId: string) {
    const room = `${tenantId}_MAGASINIER`;
    this.logger.log(`Émission vente_prise_en_charge vers la room: ${room}`);
    this.server.to(room).emit('vente_prise_en_charge', { venteId });
  }
}
