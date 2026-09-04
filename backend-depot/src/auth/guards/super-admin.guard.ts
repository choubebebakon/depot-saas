import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authUser = request.user;

    if (!authUser?.userId) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    // Le flag SuperAdmin est vérifié en base afin qu'un token ancien ne
    // conserve pas des privilèges après révocation. L'état actif est aussi
    // contrôlé pour fermer immédiatement l'accès à un compte désactivé.
    const dbUser = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        tenantId: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive || !dbUser.isSuperAdmin) {
      throw new ForbiddenException(
        'Accès refusé. Réservé aux super-administrateurs actifs.',
      );
    }

    // Un contexte tenant falsifié dans request.user ne doit jamais devenir
    // une source d'autorité pour les endpoints SuperAdmin.
    request.user = {
      ...authUser,
      userId: dbUser.id,
      tenantId: dbUser.tenantId,
      isSuperAdmin: true,
    };

    return true;
  }
}
