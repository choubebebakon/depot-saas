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

function getAllowedVenteOrigins(): string[] {
  const configured = (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.length > 0) return configured;
  return [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
}

@WebSocketGateway({
  cors: {
    origin: getAllowedVenteOrigins(),
    credentials: true,
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
    @MessageBody() payload: { tenantId: string; role: string; depotId?: string },
  ) {
    if (payload.tenantId && payload.role) {
      const tenantRoom = `${payload.tenantId}_${payload.role}`;
      client.join(tenantRoom);
      if (payload.depotId) {
        const depotRoom = `${payload.tenantId}_${payload.depotId}_${payload.role}`;
        client.join(depotRoom);
        this.logger.log(`Client ${client.id} a rejoint la room dépôt: ${depotRoom}`);
      } else {
        this.logger.log(`Client ${client.id} a rejoint la room: ${tenantRoom}`);
      }
    }
  }

  // Méthode appelée par le VentesService lors d'une nouvelle vente EN_ATTENTE
  emitNouvelleVente(tenantId: string, vente: any) {
    if (vente?.depotId) {
      const depotRoom = `${tenantId}_${vente.depotId}_MAGASINIER`;
      this.logger.log(`Émission nouvelle_vente vers la room dépôt: ${depotRoom}`);
      this.server.to(depotRoom).emit('nouvelle_vente', vente);
    }
    const tenantRoom = `${tenantId}_MAGASINIER`;
    this.server.to(tenantRoom).emit('nouvelle_vente', vente);
  }

  // Méthode appelée par le VentesService lors de la validation d'une vente
  emitVentePriseEnCharge(tenantId: string, venteId: string, depotId?: string) {
    if (depotId) {
      const depotRoom = `${tenantId}_${depotId}_MAGASINIER`;
      this.server.to(depotRoom).emit('vente_prise_en_charge', { venteId });
    }
    const tenantRoom = `${tenantId}_MAGASINIER`;
    this.server.to(tenantRoom).emit('vente_prise_en_charge', { venteId });
  }
}
