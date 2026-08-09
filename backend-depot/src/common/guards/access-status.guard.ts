import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma.service';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { Reflector } from '@nestjs/core';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}


@Injectable()
export class AccessStatusGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.DISABLE_SUBSCRIPTION_CHECKS === 'true') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user;

    if (!user?.tenantId) {
      return true;
    }

    const tenant = await this.getTenantAccess(user.tenantId);

    response.setHeader('X-Tenant-Status', tenant.subscriptionStatus);

    if (
      tenant.subscriptionStatus === SubscriptionStatus.ACTIVE ||
      tenant.subscriptionStatus === SubscriptionStatus.TRIALING
    ) {
      return true;
    }

    if (tenant.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
      response.setHeader('X-Tenant-Warning', 'PAYMENT_PAST_DUE');
      return true;
    }

    // CANCELED ou TRIAL_EXPIRED : lecture seule
    if (request.method === 'GET') {
      response.setHeader('X-Tenant-Read-Only', 'true');
      response.setHeader('X-Tenant-Redirect', '/billing/expired');
      return true;
    }

    throw new ForbiddenException({
      error: 'TENANT_SUBSCRIPTION_INACTIVE',
      message: 'Abonnement inactif. Acces limite a la lecture seule.',
      readOnly: true,
      redirect: '/billing/expired',
    });
  }

  private async getTenantAccess(
    tenantId: string,
  ): Promise<{ subscriptionStatus: SubscriptionStatus }> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { subscriptionStatus: true },
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
}