import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { StatutAbonnement } from '@prisma/client'; // ðŸ‘ˆ AJOUTÃ‰ : Pour Ã©viter les strings magiques

@Injectable()
export class SaasGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Gestion des routes publiques (@Public())
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    console.log('DEBUG_GUARD_USER:', request.user);
    const userTenantId = request.user?.tenantId;

    // 2. SÃ‰CURITÃ‰ ABSOLUE : On impose le tenantId extrait du JWT
    const tenantId = userTenantId;

    if (!tenantId) {
      throw new HttpException(
        "Tenant ID manquant dans le jeton d'authentification.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 3. On attache le tenantId Ã  la requÃªte pour que les contrÃ´leurs/services puissent y accÃ©der directement
    request.tenantId = tenantId;

    // 4. RÃ©cupÃ©ration du Tenant en Base de donnÃ©es
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException(
        'Espace de travail (Tenant) introuvable.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 5. --- VÃ‰RIFICATION DU PAYWALL ET DE L'ABONNEMENT ---
    const now = new Date();

    // CORRECTION : Utilisation de l'Enum typÃ© au lieu de la chaÃ®ne 'EXPIRED'
    const isExpiredByStatus =
      tenant.statutAbonnement === StatutAbonnement.EXPIRED;
    const isExpiredByDate =
      tenant.dateExpiration && tenant.dateExpiration < now;

    if (isExpiredByStatus || isExpiredByDate) {
      throw new HttpException(
        'Votre abonnement a expirÃ©. Veuillez renouveler votre forfait (20 000 FCFA/mois) pour continuer Ã  utiliser le service.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true; // AccÃ¨s validÃ©
  }
}
