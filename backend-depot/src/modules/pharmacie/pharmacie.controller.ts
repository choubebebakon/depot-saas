import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('pharmacie')
export class PharmacieController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const [medicaments, ordonnancesActives, alertesDLC] = await Promise.all([
      this.prisma.medicament.count({ where: { tenantId } }),
      this.prisma.ordonnance.count({ where: { tenantId, statut: 'ACTIVE' } }),
      this.prisma.medicament.count({ where: { tenantId, dateExpiration: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() } } }),
    ]);
    return { medicaments, ordonnancesActives, alertesDLC };
  }

  // --- Stubs Phase 2 ---
  @Get('parametres')
  async getParametres() {
    return {};
  }

  @Patch('parametres')
  async updateParametres(@Body() body: any) {
    return body;
  }

  @Get('stats/ventes')
  async getStatsVentes() {
    return {
      chiffreAffaires: 0,
      ventes: [],
      croissance: 0
    };
  }
}
