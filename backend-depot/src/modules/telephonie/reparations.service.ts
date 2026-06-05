import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Reparation } from '@prisma/client';

@Injectable()
export class ReparationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Reparation> {
    return this.prisma.reparation.create({ data });
  }

  async findAll(tenantId: string): Promise<Reparation[]> {
    return this.prisma.reparation.findMany({ where: { tenantId } });
  }
}
