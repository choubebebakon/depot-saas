// backend-depot/src/sites/sites.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) { }

  findAll(tenantId: string) {
    return this.prisma.site.findMany({
      where: { tenantId },
    });
  }
}