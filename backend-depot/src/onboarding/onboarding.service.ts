import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../common/email/email.service';
import { MetierType } from '../common/config/metier-roles.config';
import { METIER_ROLES } from '../common/config/metier-roles.config';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async setupMetier(tenantId: string, metier: MetierType, userId: string) {
    if (metier === MetierType.DEPOT_BOISSONS) {
      throw new BadRequestException('Métier déjà géré');
    }

    const roles = METIER_ROLES[metier];
    if (!roles) throw new BadRequestException('Métier invalide');

    const adminRole = roles.find((r) => r.isAdmin) || roles[0];
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: adminRole.nom as any },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    if (user?.email && tenant?.name) {
      this.emailService
        .sendOnboardingComplete(user.email, tenant.name, metier)
        .catch(() => {});
    }
  }
}
