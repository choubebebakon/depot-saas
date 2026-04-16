import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // 1. Chercher l'utilisateur par email
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
        });

        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        // 2. Vérifier le mot de passe (bcrypt)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        // 3. Vérifier que le tenant est actif
        if (!user.tenant.estActif) {
            throw new UnauthorizedException('Compte suspendu. Contactez votre administrateur.');
        }

        // 4. Générer le JWT avec les infos essentielles
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };

        const token = this.jwtService.sign(payload);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                nomEntreprise: user.tenant.nomEntreprise,
                statutAbonnement: user.tenant.statutAbonnement,
            },
        };
    }

    // Utilitaire pour créer un utilisateur avec mot de passe hashé
    async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, 12);
    }
}