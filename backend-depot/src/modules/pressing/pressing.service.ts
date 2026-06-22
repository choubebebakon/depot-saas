import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TicketPressing, TicketPressingStatut } from '@prisma/client';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateTicketPressingDto, UpdateTicketStatutDto } from './dto/pressing.dto';

export class PaginationDto {
  @IsOptional() @IsNumber() page?: number = 1;
  @IsOptional() @IsNumber() limit?: number = 20;
  @IsOptional() @IsString() search?: string;
}

@Injectable()
export class PressingService {
  constructor(private prisma: PrismaService) {}

  async findAllTickets(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search && typeof pagination.search === 'string' && pagination.search.trim() !== '') {
      where.reference = { contains: pagination.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.ticketPressing.findMany({ where, skip, take: limit, include: { client: true } }),
      this.prisma.ticketPressing.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createTicket(tenantId: string, data: CreateTicketPressingDto) {
    return this.prisma.ticketPressing.create({
      data: {
        ...data,
        tenantId,
        vetements: { create: data.vetements },
      },
    });
  }

  async getTicketDetail(id: string, tenantId: string) {
    return this.prisma.ticketPressing.findFirst({ where: { id, tenantId }, include: { vetements: true, client: true } });
  }

  async updateTicketStatut(id: string, tenantId: string, data: UpdateTicketStatutDto) {
    return this.prisma.ticketPressing.update({ where: { id, tenantId }, data: { statut: data.statut as any } });
  }

  async getTicketsByClient(clientId: string, tenantId: string) {
    return this.prisma.ticketPressing.findMany({ where: { clientId, tenantId } });
  }

  async getTicketsPrets(tenantId: string) {
    return this.prisma.ticketPressing.findMany({ where: { tenantId, statut: 'PRET' } });
  }

  async marquerCommeRetire(id: string, tenantId: string) {
    return this.prisma.ticketPressing.update({ where: { id, tenantId }, data: { statut: 'RETIRE', dateRetirée: new Date() } });
  }

  async getStats(tenantId: string) {
    const [enCours, prets, recettes] = await Promise.all([
      this.prisma.ticketPressing.count({ where: { tenantId, statut: { in: ['RECU', 'EN_TRAITEMENT'] } } }),
      this.prisma.ticketPressing.count({ where: { tenantId, statut: 'PRET' } }),
      this.prisma.ticketPressing.aggregate({ where: { tenantId, dateDepot: { gte: new Date(new Date().setHours(0,0,0,0)) } }, _sum: { montantTotal: true } }),
    ]);
    return { ticketsEnCours: enCours, pretsRetrait: prets, recettesJour: recettes._sum.montantTotal || 0, clients: 0 };
  }
}
