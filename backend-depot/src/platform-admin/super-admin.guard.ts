import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Ajuste le chemin vers ton PrismaService

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Non authentifié');
    }

    // Lookup direct en base pour garantir que le flag isSuperAdmin est à jour
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true }
    });

    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('Accès réservé aux Super Admins');
    }

    return true;
  }
}