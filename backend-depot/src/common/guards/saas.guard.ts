import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

@Injectable()
export class SaasGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const userTenantId = request.user?.tenantId;
    
    // Le tenantId peut provenir du body (POST/PUT), de la query (GET) ou des headers
    const tenantId =
      request.body?.tenantId ||
      request.query?.tenantId ||
      request.headers['x-tenant-id'] ||
      userTenantId;

    if (!tenantId) {
      // Sécurité stricte : s'il n'y a pas de tenant défini dans la requête, accès refusé
      throw new HttpException('Tenant ID manquant dans la requête.', HttpStatus.BAD_REQUEST);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new HttpException('Tenant introuvable.', HttpStatus.NOT_FOUND);
    }

    if (userTenantId && tenantId !== userTenantId) {
      throw new HttpException('Accès interdit sur un autre tenant.', HttpStatus.FORBIDDEN);
    }

    // --- VERIFICATION DU PAYWALL ---
    const now = new Date();
    const isExpiredByStatus = tenant.statutAbonnement === 'EXPIRED';
    const isExpiredByDate = tenant.dateExpiration && tenant.dateExpiration < now;

    if (isExpiredByStatus || isExpiredByDate) {
        throw new HttpException(
            'Votre abonnement a expiré. Veuillez renouveler votre forfait (20 000 FCFA/mois) pour continuer à utiliser le service.',
            HttpStatus.PAYMENT_REQUIRED
        );
    }

    return true; // Accès autorisé, il est en TRIAL valide ou ACTIVE
  }
}
