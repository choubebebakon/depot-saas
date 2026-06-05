import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Plat } from '@prisma/client';

@Injectable()
export class PlatsService {
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string): Promise<Plat[]> {
    return this.prisma.plat.findMany({ where: { tenantId } });
  }
}
