import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { StatutAbonnement } from '@prisma/client'; // 👈 AJOUTÉ : Pour éviter les strings magiques

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
    const userTenantId = request.user?.tenantId;
    
    // 2. SÉCURITÉ ABSOLUE : On impose le tenantId extrait du JWT
    const tenantId = userTenantId;

    if (!tenantId) {
      throw new HttpException('Tenant ID manquant dans le jeton d\'authentification.', HttpStatus.UNAUTHORIZED);
    }

    // 3. On attache le tenantId à la requête pour que les contrôleurs/services puissent y accéder directement
    request.tenantId = tenantId;

    // 4. Récupération du Tenant en Base de données
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new HttpException('Espace de travail (Tenant) introuvable.', HttpStatus.NOT_FOUND);
    }

    // 5. --- VÉRIFICATION DU PAYWALL ET DE L'ABONNEMENT ---
    const now = new Date();
    
    // CORRECTION : Utilisation de l'Enum typé au lieu de la chaîne 'EXPIRED'
    const isExpiredByStatus = tenant.statutAbonnement === StatutAbonnement.EXPIRED;
    const isExpiredByDate = tenant.dateExpiration && tenant.dateExpiration < now;

    if (isExpiredByStatus || isExpiredByDate) {
        throw new HttpException(
            'Votre abonnement a expiré. Veuillez renouveler votre forfait (20 000 FCFA/mois) pour continuer à utiliser le service.',
            HttpStatus.PAYMENT_REQUIRED
        );
    }

    return true; // Accès validé
  }
}