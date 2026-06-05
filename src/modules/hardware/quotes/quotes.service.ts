import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createQuoteDto: CreateQuoteDto) {
    return this.prisma.quote.create({
      data: { ...createQuoteDto, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.quote.findMany({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.quote.findFirst({ where: { id, tenantId } });
  }

  async update(tenantId: string, id: string, updateQuoteDto: UpdateQuoteDto) {
    return this.prisma.quote.update({
      where: { id, tenantId },
      data: updateQuoteDto,
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.quote.delete({
      where: { id, tenantId },
    });
  }
}
