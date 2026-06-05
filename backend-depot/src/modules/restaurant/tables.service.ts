import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Table } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string): Promise<Table[]> {
    return this.prisma.table.findMany({ where: { tenantId } });
  }
}
