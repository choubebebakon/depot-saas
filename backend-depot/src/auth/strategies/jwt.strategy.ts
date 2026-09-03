import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  tenantId: string;
  depotId?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  depotId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET?.trim() || (
      process.env.NODE_ENV === 'production' ? undefined : 'dev-only-jwt-secret-change-me'
    );

    if (!jwtSecret) {
      throw new Error('JWT_SECRET est obligatoire en production.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token invalide');
    }

    // Les claims role/tenant/depot d'un ancien token ne doivent pas conserver
    // des privilèges après une modification de compte. La base est l'autorité.
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        depotId: true,
        isActive: true,
        tenant: {
          select: { estActif: true },
        },
      },
    });

    if (!user || !user.isActive || !user.tenant.estActif) {
      throw new UnauthorizedException('Session invalide ou compte indisponible.');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      depotId: user.depotId ?? null,
    };
  }
}
