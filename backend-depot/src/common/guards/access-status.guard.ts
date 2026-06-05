import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma.service';

/**
 * Période de grâce en jours après expiration de l'abonnement.
 * Compensation des aléas réseau au Cameroun.
 */
const GRACE_PERIOD_DAYS = 3;

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Guard pour la vérification du statut d'accès du tenant.
 * Appliqué sur toutes les routes protégées.
 *
 * ACTIVE       → accès total
 * GRACE_PERIOD → accès total + bannière d'avertissement
 * EXPIRED      → GET uniquement (lecture seule)
 */
@Injectable()
export class AccessStatusGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Applique les règles d'accès selon le statut d'abonnement du tenant.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user;

    if (!user?.tenantId) {
      return true;
    }

    const tenant = await this.getTenantAccess(user.tenantId);
    const effectiveStatus = this.resolveEffectiveStatus(tenant.status, tenant.subscriptionEnd);

    response.setHeader('X-Tenant-Status', effectiveStatus);

    if (effectiveStatus === TenantStatus.ACTIVE) {
      return true;
    }

    if (effectiveStatus === TenantStatus.GRACE_PERIOD) {
      response.setHeader('X-Tenant-Warning', 'SUBSCRIPTION_GRACE_PERIOD');
      return true;
    }

    if (request.method === 'GET') {
      response.setHeader('X-Tenant-Read-Only', 'true');
      response.setHeader('X-Tenant-Redirect', '/pricing');
      return true;
    }

    throw new ForbiddenException({
      error: 'TENANT_EXPIRED_READ_ONLY',
      message: 'Abonnement expire. Acces limite a la lecture seule.',
      readOnly: true,
      redirect: '/pricing',
    });
  }

  /**
   * Récupère le statut et la date de fin d'abonnement du tenant.
   * Ajustement du type de retour : subscriptionEnd peut être Date ou null
   */
  private async getTenantAccess(tenantId: string): Promise<{ status: TenantStatus; subscriptionEnd: Date | null }> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          status: true,
          subscriptionEnd: true,
        },
      });

      if (!tenant) {
        throw new ForbiddenException({
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant introuvable.',
        });
      }

      return tenant;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException({
        error: 'TENANT_ACCESS_CHECK_FAILED',
        message: "Impossible de verifier l'abonnement pour le moment.",
      });
    }
  }

  /**
   * Calcule le statut effectif avec 3 jours de grâce après subscriptionEnd.
   * Sécurisé contre les valeurs nulles.
   */
  private resolveEffectiveStatus(status: TenantStatus, subscriptionEnd: Date | null): TenantStatus {
    // Sécurité : Si aucune date de fin n'est définie, on se base uniquement sur le statut en BDD
    if (!subscriptionEnd) {
      return status === TenantStatus.EXPIRED ? TenantStatus.EXPIRED : TenantStatus.ACTIVE;
    }

    const now = Date.now();
    const end = subscriptionEnd.getTime();
    const graceEnd = end + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

    if (status === TenantStatus.EXPIRED || now > graceEnd) {
      return TenantStatus.EXPIRED;
    }

    if (status === TenantStatus.GRACE_PERIOD || now > end) {
      return TenantStatus.GRACE_PERIOD;
    }

    return TenantStatus.ACTIVE;
  }
}