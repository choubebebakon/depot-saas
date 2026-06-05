import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Promotion } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Promotion> {
    return this.prisma.promotion.create({ data });
  }

  async findAll(tenantId: string): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({ where: { tenantId } });
  }
}

@Injectable()
export class CreditClientService {
  constructor(private prisma: PrismaService) {}
  // Logic...
}
