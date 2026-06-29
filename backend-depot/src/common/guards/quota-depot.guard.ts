import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Guard pour la vérification du quota de dépôts.
 * Cible uniquement les requêtes POST sur l'endpoint des dépôts.
 */
@Injectable()
export class QuotaDepotGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // SÉCURITÉ : N'intercepter QUE les requêtes POST
    if (request.method !== 'POST') {
      return true;
    }

    // EXTRA SÉCURITÉ : S'assurer qu'on cible bien l'endpoint de création de dépôts
    // Évite les effets de bord si le guard est déclaré globalement (APP_GUARD)
    const isDepotRoute =
      request.path.endsWith('/depots') || request.path.includes('/depots/');
    if (!isDepotRoute) {
      return true;
    }

    const tenantId = request.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException({
        error: 'TENANT_REQUIRED',
        message: 'Tenant requis pour creer un depot.',
      });
    }

    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxDepots: true },
      });

      if (!tenant) {
        throw new ForbiddenException({
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant introuvable.',
        });
      }

      const count = await this.prisma.depot.count({
        where: { tenantId, isArchived: false },
      });

      if (count >= tenant.maxDepots) {
        throw new ForbiddenException({
          error: 'QUOTA_REACHED',
          message: 'Quota de depots atteint pour votre plan.',
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException({
        error: 'QUOTA_CHECK_FAILED',
        message: 'Impossible de verifier le quota de depots pour le moment.',
      });
    }
  }
}
