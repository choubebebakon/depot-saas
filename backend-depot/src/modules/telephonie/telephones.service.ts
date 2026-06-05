import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Telephone } from '@prisma/client';

@Injectable()
export class TelephonesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Telephone> {
    return this.prisma.telephone.create({ data });
  }

  async findAll(tenantId: string): Promise<Telephone[]> {
    return this.prisma.telephone.findMany({ where: { tenantId } });
  }
}
