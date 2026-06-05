import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Chantier } from '@prisma/client';

@Injectable()
export class ChantierService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Chantier> {
    return this.prisma.chantier.create({ data });
  }

  async findAll(tenantId: string): Promise<Chantier[]> {
    return this.prisma.chantier.findMany({ where: { tenantId } });
  }
}
