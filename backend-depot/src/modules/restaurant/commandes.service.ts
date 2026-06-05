import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Commande } from '@prisma/client';

@Injectable()
export class CommandesService {
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string): Promise<Commande[]> {
    return this.prisma.commande.findMany({ where: { tenantId } });
  }
}
