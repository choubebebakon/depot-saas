import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { RoleUser } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: any) {
        const { nomEntreprise, email, password } = dto;

        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    nomEntreprise,
                    estActif: true,
                    statutAbonnement: 'TRIAL',
                },
            });

            const depotPrincipal = await tx.depot.create({
                data: {
                    nom: 'Depot Principal',
                    adresse: 'A renseigner',
                    emplacement: 'Localisation par defaut',
                    tenantId: tenant.id,
                }
            });

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: RoleUser.PATRON,
                    tenantId: tenant.id,
                    depotId: depotPrincipal.id,
                },
            });

            return {
                message: 'Compte cree avec succes',
                tenantId: tenant.id,
                email: user.email
            };
        });
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
        });

        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        if (!user.tenant.estActif) {
            throw new UnauthorizedException('Compte suspendu. Contactez votre administrateur.');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            depotId: user.depotId ?? undefined,
        };

        const token = this.jwtService.sign(payload);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                depotId: user.depotId ?? null,
                nomEntreprise: user.tenant.nomEntreprise,
                statutAbonnement: user.tenant.statutAbonnement,
            },
        };
    }

    async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, 12);
    }
}
