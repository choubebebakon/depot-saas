import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
    sub: string;       // userId
    email: string;
    role: string;
    tenantId: string;
    siteId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'depot_saas_secret_super_secure_2026',
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub || !payload.tenantId) {
            throw new UnauthorizedException('Token invalide');
        }
        // L'objet retourné est injecté dans req.user partout
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
        };
    }
}