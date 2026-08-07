import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException("Utilisateur non authentifié.");
    }

    // On va taper en base pour vérifier si l'utilisateur a vraiment le flag isSuperAdmin
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { isSuperAdmin: true },
    });

    if (!dbUser || !dbUser.isSuperAdmin) {
      throw new ForbiddenException("Accès refusé. Réservé aux super-administrateurs.");
    }

    return true;
  }
}
