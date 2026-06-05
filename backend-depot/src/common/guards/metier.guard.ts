import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MetierType } from '../config/metier-roles.config';
import { METIER_KEY } from '../../auth/decorators/metier.decorator';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MetierGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredMetier = this.reflector.getAllAndOverride<MetierType>(METIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredMetier) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Aucun tenant associé');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metier: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant introuvable');
    }

    const normalizedRequired = requiredMetier;
    const normalizedTenant = tenant.metier as string;

    if (normalizedTenant !== normalizedRequired) {
      throw new ForbiddenException('Accès non autorisé pour ce métier');
    }

    return true;
  }
}
