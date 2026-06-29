import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../common/email/email.service';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { Role, StatutAbonnement } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: any) {
    const { nomEntreprise, email, password, metier } = dto;

    if (!dto.acceptTerms) {
      throw new BadRequestException('Acceptation des CGU obligatoire');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Un compte avec cet email existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // On utilise la création imbriquée pure sans AUCUN ID manuel
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.PATRON,
          tenant: {
            create: {
              name: nomEntreprise,
              estActif: true,
              statutAbonnement: StatutAbonnement.TRIAL,
              planType: 'FREE',
              metier: metier || 'DEPOT_BOISSONS',
              depots: {
                create: {
                  nom: 'Depot Principal',
                  adresse: 'A renseigner',
                  emplacement: 'Localisation par defaut',
                },
              },
            },
          },
        },
        include: {
          tenant: true, // On inclut le tenant pour retourner l'info
        },
      });

      this.emailService
        .sendWelcomeEmail(user.email, nomEntreprise)
        .catch((err) => {
          console.error('Erreur envoi email bienvenue:', err.message);
        });

      return {
        message: 'Compte créé avec succès',
        tenantId: user.tenantId,
        email: user.email,
        metier: user.tenant.metier,
      };
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.tenant.estActif) {
      throw new UnauthorizedException(
        'Compte suspendu. Contactez votre administrateur.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      depotId: user.depotId ?? undefined,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_secure_2026',
      expiresIn: '30d',
    });

    const refreshTokenHash = await argon2.hash(refresh_token);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        depotId: user.depotId ?? null,
        nomEntreprise: user.tenant.nomEntreprise ?? user.tenant.name,
        metier: user.tenant.metier,
        statutAbonnement: user.tenant.statutAbonnement,
      },
    };
  }

  async getTenantInfo(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        metier: true,
        nomEntreprise: true,
        name: true,
        statutAbonnement: true,
      },
    });
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async validateRefreshTokenFromCookie(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_secure_2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (
        !user ||
        !user.refreshTokenHash ||
        !(await argon2.verify(user.refreshTokenHash, token))
      ) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Token de renouvellement manquant');
    }

    const user = await this.validateRefreshTokenFromCookie(refreshToken);
    if (!user) {
      throw new UnauthorizedException(
        'Token de renouvellement invalide ou expire',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      depotId: user.depotId ?? undefined,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
