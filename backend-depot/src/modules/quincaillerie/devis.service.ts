import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Devis, DevisStatut } from '@prisma/client';

@Injectable()
export class DevisService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Devis> {
    return this.prisma.devis.create({ data });
  }

  async findAll(tenantId: string): Promise<Devis[]> {
    return this.prisma.devis.findMany({ where: { tenantId } });
  }
}
