import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { Role } from '@prisma/client';

/**
 * Strategie JWT pour la validation des refresh tokens depuis les cookies httpOnly.
 * Utilisee par le guard JwtRefreshGuard pour proteger les routes de renouvellement de token.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.refreshToken || request?.body?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKeyProvider: async (
        request: any,
        rawJwtToken: any,
        done: any,
      ) => {
        try {
          const secret =
            process.env.JWT_REFRESH_SECRET || 'refresh_secret_secure_2026';
          return done(undefined, secret);
        } catch (error) {
          return done(error, undefined);
        }
      },
    });
  }

  /**
   * Valide le refresh token et retourne le payload utilisateur.
   */
  async validate(
    req: any,
    payload: any,
  ): Promise<{ userId: string; tenantId: string; role: Role }> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedException({
          error: 'REFRESH_TOKEN_MISSING',
          message: 'Token de renouvellement manquant.',
        });
      }

      const user =
        await this.authService.validateRefreshTokenFromCookie(refreshToken);
      if (!user) {
        throw new UnauthorizedException('Token invalide ou expiré');
      }
      return { userId: user.id, tenantId: user.tenantId, role: user.role };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        error: 'REFRESH_TOKEN_INVALID',
        message: 'Token de renouvellement invalide.',
      });
    }
  }
}
